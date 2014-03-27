from bs4 import BeautifulSoup
import requests
import codecs
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.support import expected_conditions as EC 
from pyelasticsearch import ElasticSearch
import time
import random
import re

sys.stdout = codecs.getwriter("utf-8")(sys.__stdout__)

# movies URL page 1
url = "http://www.amazon.com/s/ref=sr_nr_n_0?rh=n%3A2858778011%2Cp_85%3A2470955011%2Cn%3A2858905011&bbn=2858778011&ie=UTF8&qid=1395198989&rnid=2858778011&lo=none"
url = "http://www.amazon.com/s/ref=sr_pg_369?rh=n%3A2858778011%2Cp_85%3A2470955011%2Cn%3A2858905011&page=369&bbn=2858778011&ie=UTF8&qid=1395246286&lo=none"
movie_id_pattern = re.compile(".*?dp/(.*?)/.*")
es = ElasticSearch("http://localhost:9200/")

def get_html(outf, driver):
    m = 0
    # TODO: get content html and parse with bs4
    # to avoid StaleElementException while iterating
    print "starting get_html"
    for prod in driver.find_elements_by_class_name("prod"):
        if prod.get_attribute("innerHTML"):
            print "\tprod %i" % m
            outf.write("<!--- %i -->\n" % m)
            data = prod.get_attribute("innerHTML")
            outf.write(data)
            soup = BeautifulSoup(data)
            # image = .productImage attr=src
            img_src = soup.find(class_="productImage")["src"]
            # title = h3.newaps span.bold
            meta = soup.find(class_="newaps")
            title = meta.span.text
            # url = h3.newaps a attr=href
            url = meta.a["href"]
            # id dp/x/
            match = movie_id_pattern.match(url)
            if match:
                mid = match.group(1)
            else:
                mid = url
            # year = h3.newaps span.med (remove span.bdge)
            year = meta.find(class_="med")
            if year is not None:
                year = re.sub('\D+', '', year.text)
            doc = {
                "amazon_url": url,
                "image_url" : img_src,
                "title" : title,
                "year" : year
            }
            print es.index("prime", "movie", doc, id=mid)
            m += 1

driver = webdriver.Firefox()
driver.implicitly_wait(5)
driver.get(url)

out = codecs.open("out.html", "w", "utf-8")
for i in range(100):
    print "start %i" % i
    el = driver.find_element_by_id("pagnNextLink")
    y = el.location["y"]
    print "found pagenNextLink y=%i" % y
    scroll = "scroll(0," + str(y) + ")"
    driver.execute_script(scroll)
    print "scrolled"
    out.write("<!--- page %i --->\n" % i)
    get_html(out, driver)
    print "got html"
    # random delay
    time.sleep(1+random.random()*4)
    el = driver.find_element_by_id("pagnNextLink")
    print "found pagnNextLink again"
    el.click()
    time.sleep(2)
    print "done click"

#print "\n\n%s" % data
out.close()
