const { webkit } = require('playwright');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, counter, ...args) {
    await sleep(2000);
    let result = await fn(...args);
    if(result){
      return true;
    } else {
      retry(fn, counter+1, ...args);
    }
}

(async () => {
  //execPath = "/Applications/Safari.app/Contents/MacOS/Safari"
  //execPath = "/Applications/Safari.app/Contents/MacOS/SafariForWebKitDevelopment"
  const browser = await webkit.launch({ headless: false , args: [
  ], //executablePath:execPath
  });

  const page = await browser.newPage();

  let meetingToken = null;
  let msg = "";
  let loadSuccess = null;

  console.log(process.argv);
  //node is argument 0, this file is argument 1, so argv starts at index 2
  let initialToken = process.argv[2];
  let endpointToken = process.argv[3];
  let meeting = process.argv[4];
  let endpointSIP = process.argv[5];
  if(process.argv.length > 6){
    meetingToken = process.argv[6];
  }

  page.on("console", (msg) => {
    console.log(msg)
  })

  page.on("pageerror", (err) => {
    console.log(err)
  })

  page.on("request", (req) => {
    var pathname = new URL(req.url()).pathname;
    if(pathname == "/listener"){
      console.log("REQUEST");
      console.log(req.postDataJSON());
      let resultObject = req.postDataJSON();
      console.log(req.headers());
      if(req.headers()['element-id'] == "loadedStatus"){
        console.log('here')
        let tokenPositions = {"first":"initialToken", "second":"endpointToken", "third":"meetingToken"};
        console.log(Object.keys(resultObject));
        for(let key of Object.keys(resultObject)){
          console.log(resultObject[key]);
          if(resultObject[key].success !== true){
            loadSuccess = false;
            console.log('failure!')
            console.log(resultObject[key])
            let tokenPosition = tokenPositions[key];
            if(resultObject[key].code == 401){
              msg += `The ${tokenPosition} is unauthorized. (401)`;
            } else {
              msg += `The ${tokenPosition} is not valid. `;
            }
          }
        }
        if(loadSuccess == null){
          loadSuccess = true;
        }
      }
    }
  })

  if(meetingToken != initialToken){
    let argumentString = `initialToken=${initialToken}&endpointToken=${endpointToken}`;
    if(meetingToken != null){
      console.log("meetingToken is not null.  Setting in argumentString.");
      argumentString += `&meetingToken=${meetingToken}`;
    }
    //let gotoURL = `http://localhost:${process.env.HIDDEN_PORT}?${argumentString}`;
    //let gotoURL = `file://${__dirname}/launch.html?${argumentString}`;
    let gotoURL = `http://localhost:10031/launch.html?${argumentString}`;
    console.log(gotoURL);
    await page.goto(gotoURL);
    console.log('page loaded')

    let loadInterval = setInterval(function(){
      if(loadSuccess != null){
        clearInterval(loadInterval);
        if(loadSuccess == true){
          var config = {
                        "meetingSIP":meeting,
                        "endpointSIP":endpointSIP,
                        "launcher":"webkit",
                       };
          result = page.evaluate((config) => operator(config), config)
        } else {
          console.log("TODO: FAILURE");
        }
      }
    }, 2000);
    //let loadedStatus = await page.waitForSelector('#loadedStatus');
    //await page.waitForFunction(() => loadedReady == true);
    //let resultObject = JSON.parse(await page.innerHTML("#loadedStatus"));
    //console.log(resultObject);
    //await sleep(12000);
    //resultObject={"first":{"success":true}, "second":{"success":true}}
    console.log("Moving on.");

    let tokenPositions = {"first":"initialToken", "second":"endpointToken", "third":"meetingToken"};
    
    if(loadSuccess){
      var config = {
                    "meetingSIP":meeting,
                    "endpointSIP":endpointSIP,
                    "launcher":"webkit",
                   };
      result = await page.evaluate((config) => operator(config), config)
      console.log(result);
      resultObject = null;
      try{
        //await page.waitForFunction(() => firstLegReady == true, {timeout:60000});
        resultObject = JSON.parse(await page.innerHTML("#firstLegStatus"), {timeout:60000});
        //let firstLegStatus = await page.waitForSelector('#firstLegStatus', {timeout: 60000});
        //resultObject = JSON.parse(await firstLegStatus.innerHTML());
        console.log('firstLegStatus');
        console.log(resultObject);
      }catch(e){
        msg = "Timeout waiting for initialToken user to be let into meetingSIP. ";
        console.log(msg);
      }
      if(resultObject != null){
        if(resultObject["result"] == "success"){
          //await page.waitForFunction(() => secondLegReady == true, {timeout:60000});
          resultObject = JSON.parse(await page.innerHTML("#secondLegStatus"));
          //let secondLegStatus = await page.waitForSelector('#secondLegStatus');
          //resultObject = JSON.parse(await secondLegStatus.innerHTML());
          console.log('secondLegStatus');
          console.log(resultObject);
          if(resultObject["result"] == "success"){
            resultObject = null;
            try{
              //await page.waitForFunction(() => thirdLegReady == true, {timeout:60000});
              resultObject = JSON.parse(await page.innerHTML("#thirdLegStatus"), {timeout:60000});
              //let thirdLegStatus = await page.waitForSelector('#thirdLegStatus', {timeout: 60000});
              //resultObject = JSON.parse(await thirdLegStatus.innerHTML());
              console.log('thirdLegStatus');
              console.log(resultObject);
            }catch(e){
              msg = "Timeout waiting for endpointToken user to be let into meetingSIP. ";
              if(process.env.MEETING_TOKEN != null){
                msg = "Timeout waiting for meetingToken user to be let into meetingSIP. ";
              }
              console.log(msg);
            }
            if(resultObject != null && resultObject["result"] != "success"){
              msg = `${config.meetingSIP} could not be joined: ${resultObject.message}`;
            }
          } else {
            msg = `${config.endpointSIP} could not be joined because ${resultObject.message}`;
          }
        } else {
          msg = `${config.meetingSIP} could not be joined: ${resultObject.message}`;
        }
      }
    } //else loadSuccess is false, msg already set
  } else {
    msg = "meetingToken cannot be the same as initialToken";
  }
  console.log("Final MSG:");
  console.log(msg);
  process.send(msg); //send this to parent process
  if(msg != ""){
    console.log('calling cleanup!');
    result = await page.evaluate(() => cleanup());
    console.log(result);
  }
  console.log('waiting for cleanup.');
  //await page.waitForFunction(() => cleanupReady == true, {timeout:0});
  resultObject = JSON.parse(await page.innerHTML("#cleanup", {timeout:0}));
  //let cleanupStatus = await page.waitForSelector('#cleanup', {timeout: 0});
  //resultObject = JSON.parse(await cleanupStatus.innerHTML());
  console.log(resultObject);
  console.log('cleanup complete.');
  console.log('closing browser.');
  await browser.close();
  process.exit();
})();
