import logging
import os
import time
import traceback
#from pyvirtualdisplay import Display
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.firefox.options import Options as FOptions

from selenium.webdriver.firefox.firefox_binary import FirefoxBinary

fo = FOptions()
fo.headless = False
#fo.set_preference("devtools.chrome.enabled", True)
#fo.set_preference("devtools.debugger.prompt-connection", False)
#fo.set_preference("devtools.debugger.remote-enabled", True)
#fo.set_preference("dom.webnotifications.enabled", False)
#fo.set_preference("media.webrtc.hw.h264.enabled", True)
#fo.set_preference("media.getusermedia.screensharing.enabled", True)
#fo.set_preference("media.navigator.permission.disabled", True)
#fo.set_preference("media.navigator.streams.fake", True)
#fo.set_preference("media.peerconnection.video.h264_enabled", True)
#fo.set_preference("media.gmp-gmpopenh264.abi", "x86_64-gcc3")
#fo.set_preference("media.gmp-gmpopenh264.lastUpdate", "1576688869")
#fo.set_preference("media.gmp-gmpopenh264.version", "1.8.1.1")
#fo.set_preference("media.gstreamer.enabled", False)
#fo.set_preference("media.videocontrols.picture-in-picture.video-toggle.mode", "2")
#fo.set_preference("media.hardware-video-decoding.force-enabled", True)
#fo.set_preference("media.autoplay.default", 0)
#fo.set_preference("media.block-autoplay-until-in-foreground", False)

def demo():
    #desired = DesiredCapabilities.FIREFOX
    #desired.update(fo.to_capabilities())
    #driver = webdriver.Firefox(desired_capabilities=desired)
    binary = FirefoxBinary('/Applications/Firefox.app/Contents/MacOS/firefox-bin')
    driver = webdriver.Firefox(options=fo, firefox_binary=binary)
    #driver = webdriver.Firefox(options=fo)
    success = False
    try:
        start_url = "{0}".format(os.environ.get("MY_HOST_NAME"))
        print("A")
        print(start_url)
        driver.get(start_url)
        success=True
    except Exception as e:
        traceback.print_exc()
    if not success:
        try:
            sipOp = "MDJmNmYzMGUtMjBlOC00YTE4LTkzY2EtNmNiZmQxYmEwMjIwZTM1ZmQ1MTYtZWYy_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f"
            sipInt = "ZWM3YmMzNzktOWYwMi00ZjhlLTg5MmUtY2Q0MGZmZjM4MTc4YWU2OTFiOTctNWU0_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f"
            argString = "initialToken={0}&endpointToken={1}".format(sipOp, sipInt)
            start_url = "http://localhost:{0}?{1}".format(os.environ.get("PORT"), argString)
            print("B")
            print(start_url)
            driver.get(start_url)
            success=True
        except Exception as e:
            traceback.print_exc()
    print('1')
    #driver.implicitly_wait(10)
    print('Page title: %s', driver.title)
    time.sleep(12)
    print('2')
    js = 'testOperator()'
    #js = 'firstLeg("Y2lzY29zcGFyazovL3VzL1JPT00vNTVlODJmYTAtNmQ2MC0xMWViLWE4ZmUtZmJhYjU0NjAwZWNl")'
    driver.execute_script(js)
    time.sleep(6000)


if __name__ == "__main__":
    try:
        print("start")
        demo()
        print("end")
    except Exception as e:
        traceback.print_exc()
