import asyncio
import json
import os
from playwright.async_api import async_playwright

from pyvirtualdisplay import Display
display = Display(visible=0, size=(800, 600))
display.start()

async def main():
    async with async_playwright() as p:


        browser = await p.webkit.launch(headless=False)
        page = await browser.new_page()

        def log_msg(msg):
            print(msg)

        page.on("console", log_msg)
        page.on("pageerror", log_msg)

        meetingToken = None
        msg = ""

        initialToken = "MTM1NzlkMjUtODcyMi00YjkxLWFmYmItYmNmM2RkOWQ0MWNjNGEwNmNmNTEtNTYw_PF84_d790c72e-b584-4211-a90c-0bc4eb6881c4"
        endpointToken = "ZWM3YmMzNzktOWYwMi00ZjhlLTg5MmUtY2Q0MGZmZjM4MTc4YWU2OTFiOTctNWU0_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f"
        meeting = "tahanson.acecloud@webex.com"
        endpointSIP = "taylors_home_dx80@wxsd.rooms.webex.com"

        if meetingToken != initialToken:
            argumentString = 'initialToken={0}&endpointToken={1}'.format(initialToken, endpointToken)
            if meetingToken != None:
                print("meetingToken is not null.  Setting in argumentString.")
                argumentString += '&meetingToken={0}'.format(meetingToken)
            #gotoURL = `http://localhost:${process.env.HIDDEN_PORT}?${argumentString}`;
            print(os.getcwd())
            gotoURL = 'file://{0}/launch.html?{1}'.format(os.getcwd(), argumentString)
            print(gotoURL);
            await page.goto(gotoURL, wait_until='domcontentloaded')

            loadedStatus = await page.wait_for_selector('#loadedStatus')
            resultObject = json.loads(await loadedStatus.inner_html())

            print(resultObject)
            print("Done Loading.")
            loadSuccess = True
            tokenPositions = {"first":"initialToken", "second":"endpointToken", "third":"meetingToken"}
            for key in resultObject:
                print(resultObject[key])
                if(resultObject[key]["success"] != True):
                    loadSuccess = False
                    print('failure!')
                    print(resultObject[key])
                    tokenPosition = tokenPositions[key]
                    if resultObject[key]["code"] == 401:
                        msg += 'The {0} is unauthorized. (401)'.format(tokenPosition)
                    else:
                        msg += 'The {0} is not valid.'.format(tokenPosition)
            if loadSuccess:
                config = {
                            "meetingSIP":meeting,
                            "endpointSIP":endpointSIP,
                            "launcher":"webkit",
                           }
                result = await page.evaluate("(config) => operator(config)", config)
                print(result)
                resultObject = None
                try:
                    firstLegStatus = await page.wait_for_selector('#firstLegStatus', timeout=60000);
                    resultObject = json.loads(await firstLegStatus.inner_html())
                    print(resultObject)
                except Exception as e:
                    msg = "Timeout waiting for initialToken user to be let into meetingSIP. "
                    print(msg)
                if resultObject != None:
                    if resultObject["result"] == "success":
                        secondLegStatus = await page.wait_for_selector('#secondLegStatus')
                        resultObject = json.loads(await secondLegStatus.inner_html())
                        print(resultObject)
                        if resultObject["result"] == "success":
                            resultObject = None
                            try:
                                thirdLegStatus = await page.wait_for_selector('#thirdLegStatus', timeout=60000)
                                resultObject = json.loads(await thirdLegStatus.inner_html())
                                print(resultObject)
                            except Exception as e:
                                msg = "Timeout waiting for endpointToken user to be let into meetingSIP. "
                                if process.env.MEETING_TOKEN != None:
                                    msg = "Timeout waiting for meetingToken user to be let into meetingSIP. "
                                print(msg)
                            if resultObject != None and resultObject["result"] != "success":
                                msg = '{0} could not be joined: {1}'.format(config["meetingSIP"], resultObject["message"])
                        else:
                            msg = '{0} could not be joined because {1}'.format(config["endpointSIP"], resultObject["message"])
                    else:
                        msg = '{0} could not be joined: {1}'.format(config["meetingSIP"], resultObject["message"])
        else:
          msg = "meetingToken cannot be the same as initialToken"
        print("Final MSG:");
        print(msg);
        #process.send(msg); //send this to parent process
        if msg != "":
          print('calling cleanup!')
          result = await page.evaluate("() => cleanup()")
          print(result)
        print('waiting for cleanup.')
        cleanupStatus = await page.wait_for_selector('#cleanup', timeout=0)
        resultObject = json.loads(await cleanupStatus.inner_html())
        print(resultObject)
        print('cleanup complete.')
        print('closing browser.')
        await browser.close()
        #process.exit()

asyncio.run(main())
