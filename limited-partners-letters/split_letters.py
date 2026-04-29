#!/usr/bin/env python3
from pathlib import Path
import re
import sys
from datetime import datetime
from collections import defaultdict

if len(sys.argv) < 2:
    print("Usage: python3 split_letters.py 1956-1970.md [output_dir]")
    sys.exit(1)

input_file = Path(sys.argv[1])
output_dir = Path(sys.argv[2]) if len(sys.argv) >= 3 else Path("letters")
output_dir.mkdir(parents=True, exist_ok=True)

START_YEAR = 1956
END_YEAR = 1970

# 大小写敏感
COMPANY_MARKER = "BUFFETT PARTNERSHIP. LTD."

# 大小写敏感2
COMPANY_MARKER2 = "BUFFETT PARTNERSHIP, LTD."

MONTHS = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12",
}

text = input_file.read_text(encoding="utf-8", errors="replace")

# 只统一换行，不做其他格式化
text = text.replace("\r\n", "\n").replace("\r", "\n")

# 删除页码：只删除单独一行的数字
# 但保留 1956-1970 这些年份行
cleaned_lines = []
for line in text.splitlines(keepends=True):
    stripped = line.strip()

    if re.fullmatch(r"\d{1,4}", stripped):
        n = int(stripped)

        if START_YEAR <= n <= END_YEAR:
            cleaned_lines.append(line)
        else:
            continue
    else:
        cleaned_lines.append(line)

lines = cleaned_lines


def parse_written_date(line):
    """
    解析类似：
        July 12, 1966
        December 31, 1969

    返回：
        1966-07-12

    大小写敏感，只匹配英文月份首字母大写形式。
    """
    date_re = re.compile(
        r"\b("
        r"January|February|March|April|May|June|July|August|September|October|November|December"
        r")\s+([0-9]{1,2}),\s+(19[5-7][0-9])\b"
    )

    m = date_re.search(line)
    if not m:
        return None

    month_name, day, year = m.groups()
    month = MONTHS[month_name]
    day = f"{int(day):02d}"

    return f"{year}-{month}-{day}"


def find_date_after(lines, start_idx, max_lines=12):
    """
    从拆分点之后若干行内找日期。
    适用于 BUFFETT PARTNERSHIP. LTD. 后面几行出现 July 12, 1966 的情况。
    """
    end_idx = min(len(lines), start_idx + max_lines + 1)

    for idx in range(start_idx, end_idx):
        parsed = parse_written_date(lines[idx])
        if parsed:
            return parsed

    return None


def find_split_points(lines):
    splits = []

    # 1956 Letter / 1959 Letter 这种标题
    year_letter_re = re.compile(
        r"^[ \t]*(1956|1957|1958|1959|1960|1961|1962|1963|1964|1965|1966|1967|1968|1969|1970)[ \t]+Letter[ \t]*$"
    )

    for idx, line in enumerate(lines):
        stripped = line.strip()

        # 条件 1：年份 Letter
        m = year_letter_re.fullmatch(stripped)
        if m:
            year = m.group(1)
            splits.append({
                "start_idx": idx,
                "kind": "year_letter",
                "year": year,
                "date": None,
            })
            continue

        # 条件 2：BUFFETT PARTNERSHIP. LTD.
        if COMPANY_MARKER in line:
            date_str = find_date_after(lines, idx, max_lines=12)

            if date_str:
                year = date_str[:4]
            else:
                year = None

            splits.append({
                "start_idx": idx,
                "kind": "partnership",
                "year": year,
                "date": date_str,
            })
	# 条件 3：BUFFETT PARTNERSHIP, LTD.
        if COMPANY_MARKER2 in line:
            date_str = find_date_after(lines, idx, max_lines=12)

            if date_str:
                year = date_str[:4]
            else:
                year = None

            splits.append({
                "start_idx": idx,
                "kind": "partnership",
                "year": year,
                "date": date_str,
            })

    return splits


splits = find_split_points(lines)

# 按出现位置排序
splits.sort(key=lambda x: x["start_idx"])

# 去掉完全重复的拆分点
deduped = []
seen_positions = set()

for split in splits:
    pos = split["start_idx"]
    if pos in seen_positions:
        continue
    seen_positions.add(pos)
    deduped.append(split)

splits = deduped

if not splits:
    print("没有找到任何拆分点。")
    sys.exit(1)

print("Found split points:")
for split in splits:
    line_no = split["start_idx"] + 1
    print(
        f"  line {line_no}: "
        f"kind={split['kind']}, "
        f"year={split['year']}, "
        f"date={split['date']}"
    )


def fallback_name_from_chunk(chunk_lines, index):
    """
    如果既没有年份，也没有日期，则给一个安全的备用文件名。
    """
    for line in chunk_lines[:20]:
        m = re.search(r"\b(1956|1957|1958|1959|1960|1961|1962|1963|1964|1965|1966|1967|1968|1969|1970)\b", line)
        if m:
            return m.group(1)

    return f"letter-{index + 1:03d}"


used_names = defaultdict(int)

for i, split in enumerate(splits):
    start_idx = split["start_idx"]
    end_idx = splits[i + 1]["start_idx"] if i + 1 < len(splits) else len(lines)

    chunk_lines = lines[start_idx:end_idx]

    # 只去掉每个文件开头和结尾的空行，不改变正文内部格式
    while chunk_lines and chunk_lines[0].strip() == "":
        chunk_lines.pop(0)

    while chunk_lines and chunk_lines[-1].strip() == "":
        chunk_lines.pop()

    if split["date"]:
        base_name = split["date"]
    elif split["year"]:
        base_name = split["year"]
    else:
        base_name = fallback_name_from_chunk(chunk_lines, i)

    used_names[base_name] += 1

    if used_names[base_name] == 1:
        filename = f"{base_name}.md"
    else:
        filename = f"{base_name}-{used_names[base_name]}.md"

    out_file = output_dir / filename
    out_file.write_text("".join(chunk_lines) + "\n", encoding="utf-8")

    print(f"Wrote {out_file}")

print(f"Done. Created {len(splits)} files in {output_dir}/")
