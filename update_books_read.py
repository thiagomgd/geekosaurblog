import requests
import json
import notion
from pprint import pprint
from datetime import datetime
from time import sleep

TYPE = 'BOOKS'

def format_item(book):
    f = """
{{% card "{Title}","{Cover}","{Badge}","{review_link}" %}}
"""

    book["Badge"] = ""
    book["review_link"] = ""

    if book.get("My Rating"):
        book["Badge"] = book["My Rating"]

    if book.get("Review"):
        book["review_link"] = book["Review"]

    return f.format(**book)


organized = {}
p = {
        "filter": {
            "property": "Status",
            "select": {
                "equals": "read"
            }
        }
    }

books = notion.get_notion_data(TYPE, p=p)
print("TOTAL", len(books))

for book in books:
    b = notion.get_props_data(book)

    if b.get('Type') in ['manga', 'comic']:
        continue

    
    year = b["Date Read"].year if b.get("Date Read") else 0

    if year not in organized:
        organized[year] = []

    b_data = {
        "Title": b.get("Title"),
        "Cover": b.get("Cover"),
        "Rating": b.get("My Rating"),
        "Review": b.get("Review")
    }

    organized[year].append(b)

years = sorted(organized.keys(), reverse=True)

# pprint(years)


# text = ""

books_for_json = []

for year in years:
    year_books = organized[year]
#     # pprint(year_books[0])
    l = sorted(year_books, key=lambda i: (
        i.get('My Rating'), i.get('Date Read')), reverse=True)

    l =[dict(title=k1["Title"],cover=k1["Cover"],rating=k1.get("My Rating"),review=k1.get("Review")) for k1 in l]
    books_for_json.append({"year": year, "books":l})
#     text += """### {} 
  
#   <div class="cards">
#   """.format(year)

#     for b in l:
#         text += format_item(b)

#     text += """
#   </div>

#   """

with open('src/_data/booksRead.json', mode="w") as jsonfile:
    json.dump(books_for_json, jsonfile)


# TODO: change to DATA js file, update md to be njk and read data
# with open('src/booksperyear/index.md', mode='w') as mdfile:
#     mdfile.write("""---
# layout: layouts/post.njk
# # date: "2021-04-20"
# title: "Books Per Year"
# templateClass: tmpl-post
# permalink: /books-per-year/
# tweet: 1393699018597797893
# reddit: https://www.reddit.com/r/geekosaur/comments/ndaaoc/books_per_year/
# eleventyNavigation:
#   key: Books Per Year
#   order: 4
# ---

# """)
#     mdfile.write(text)
