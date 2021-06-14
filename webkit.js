const { webkit } = require('playwright');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await webkit.launch({ headless: false , args: [
        ]
  });

  const page = await browser.newPage();
  page.on("console", (msg) => {
    console.log(msg)
  })
  page.on("pageerror", (err) => {
    console.log(err)
  })

  let meetingToken = null;
  let msg = "";
  
  console.log(process.argv);
  //node is argument 0, this file is argument 1, so argv starts at index 2
  let initialToken = process.argv[2];
  let endpointToken = process.argv[3];
  let meeting = process.argv[4];
  let endpointSIP = process.argv[5];
  if(process.argv.length > 6){
    meetingToken = process.argv[6];
  }
  if(meetingToken != initialToken){
    let argumentString = `initialToken=${initialToken}&endpointToken=${endpointToken}`;
    if(meetingToken != null){
      console.log("meetingToken is not null.  Setting in argumentString.");
      argumentString += `&meetingToken=${meetingToken}`;
    }
    //let gotoURL = `http://localhost:${process.env.HIDDEN_PORT}?${argumentString}`;
    let gotoURL = `file://${__dirname}/launch.html?${argumentString}`;
    console.log(gotoURL);
    await page.goto(gotoURL, { waitUntil: 'domcontentloaded' });

    let loadedStatus = await page.waitForSelector('#loadedStatus');
    let resultObject = JSON.parse(await loadedStatus.innerHTML());
    console.log(resultObject);
    console.log("Done Loading.");
    let loadSuccess = true;
    let tokenPositions = {"first":"initialToken", "second":"endpointToken", "third":"meetingToken"};
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
        let firstLegStatus = await page.waitForSelector('#firstLegStatus', {timeout: 60000});
        resultObject = JSON.parse(await firstLegStatus.innerHTML());
        console.log(resultObject);
      }catch(e){
        msg = "Timeout waiting for initialToken user to be let into meetingSIP. ";
        console.log(msg);
      }
      if(resultObject != null){
        if(resultObject["result"] == "success"){
          let secondLegStatus = await page.waitForSelector('#secondLegStatus');
          resultObject = JSON.parse(await secondLegStatus.innerHTML());
          console.log(resultObject);
          if(resultObject["result"] == "success"){
            resultObject = null;
            try{
              let thirdLegStatus = await page.waitForSelector('#thirdLegStatus', {timeout: 60000});
              resultObject = JSON.parse(await thirdLegStatus.innerHTML());
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
  let cleanupStatus = await page.waitForSelector('#cleanup', {timeout: 0});
  resultObject = JSON.parse(await cleanupStatus.innerHTML());
  console.log(resultObject);
  console.log('cleanup complete.');
  console.log('closing browser.');
  await browser.close();
  process.exit();
})();
