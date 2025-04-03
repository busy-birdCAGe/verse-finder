import xml.etree.ElementTree as ET

def parse_bible_xml(xml_file, output_csv):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
        csv_lines = []
        for book in root.findall('b'):
            book_name = book.get('n')
            for chapter in book.findall('c'):
                chapter_num = chapter.get('n')
                for verse in chapter.findall('v'):
                    verse_num = verse.get('n')
                    verse_text = verse.text
                    csv_lines.append(f"{book_name}|{chapter_num}|{verse_num}|{verse_text}")
        csvfile.write("\n".join(csv_lines))

parse_bible_xml('scripts/NKJV.xml', 'nkjv.csv')