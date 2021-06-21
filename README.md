# bridgeCall
Add an unregistered SIP device to a Webex call

Requirements:  
MacOS 10.15 (Catalina)  
Node.js version 12 or above

## Environment Variables (Required)
```
export PORT=12345 #(the port your server listener will expose)
```
If you set ```PORT=12345``` in a file named ```.env``` in the root directory, this variable will be loaded in server.js at runtime.

## NPM Packages
```
npm i -D playwright
npm install dotenv
npm install express
```

## Run
```
>$ node server.js 
Your app is listening on port 12345
```

## REST API
Once your server is running, you can test it with HTTPS POST requests with a JSON payload to the /bridge path. Example:
```
POST http://localhost:12345/bridge
```

JSON Data Parameters

| Key | Required | Type | Description |
| --- | --- | --- | --- |
| `initialToken` | **required** | String | The Webex Account Bearer token for the 'operator' user that joins the meeting first. This can be a guest user. |
| `endpointToken` | **required** | String | The Webex Account Bearer token for the **licensed** user that places the outbound call to endpointSIP. |
| `meetingToken` | optional | String | The Webex Account Bearer token for the user that joins the meeting *after* the 'operator' has connected and *after* the endpointSIP call has been placed. If null or not provided, endpointToken will be used. |
| `meeting` | **required** | String | The sip address, meeting URL, or roomId of the main meeting to join. |
| `endpointSIP` | **required** | String | The sip address of the device to be added to the meeting. |
| `wait` | optional | Boolean | Defaults to false. If true, the POST request will **not** return immediately, but wait for e full bridge to be established before returning the result.  Will wait for a max of about 1 minute. Example: if the 'operator' or endpoint user has to be let in to the meeting, and is let in quickly, the response will contain the result of the bridge setup.  If the 'operator' or endpoint user are not let in to the meeting within 1 minute, the request will return with the last known state of the bridge setup.  If false, null or not provided, the POST request will respond immediately with an acknowledgement, but the bridge setup result will not be known. |  

Sample:  
```
{"initialToken":"MTM1NzlkMjUtODcyAbCdEfGWFmYmItYmNmM2RkOWQ0MWNjNGEwNmNmNTEtNTYw_PF84_d790c72e-b584-4211-a90c-0bc4eb6881c4", "endpointToken":"ZWM3YmMzNzktOWYwXrQPoMnLlLTg5MmUtY2Q0MGZmZjM4MTc4YWU2OTFiOTctNWU0_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f", "meeting":"mymeeting.mycloud@mydomain.webex.com", "endpointSIP":"123456789@example.sip.domain.com", "wait":true}
```

Postman Sample:
<img width="904" alt="Screen Shot 2021-06-16 at 12 41 32 PM" src="https://user-images.githubusercontent.com/19175490/122259497-3f7a4900-cea0-11eb-9024-a0a542cf185d.png">


## Behind The Scenes
![Bridge](https://user-images.githubusercontent.com/19175490/122417774-bcb4c500-cf57-11eb-9d9f-4df24cbdbecc.jpg)
**Figure A:**  
I.   **1** is the ```initialToken``` user who dials into the group meeting without any local media. This can be a guest user, bot, or licensed user.  
II.  **1** receives the remote stream from the group meeting, and passes it as the local stream for **2**.  
III. **2** is the ```endpointToken``` user who dials the SIP endpoint (interpreter service).
* ```endpointToken``` cannot be a guest token AND cannot be the same as initialToken.  

IV.  **2** receives the remote stream from the SIP endpoint and passes it as the local stream for **3**.  
* if provided, **3** will use the optional ```meetingToken```, but otherwise uses the ```endpointToken```.  

V.   **3** dials into the group meeting and receives another remote stream.  

**Figure B:**  
I.   It was necessary for **3** to dial into the meeting, because **1**'s local media cannot be updated because it had no local media initially.  

* This is a limitation of the SDK.  
* This now creates a loop where the SIP device user can see and hear themself in the meeting.  
II.  **2**'s local media can be updated, because it had initial media (provided by **1**).  

III. Therefore, **3** uses its remote stream to update the local stream of **2**.  

**Figure C:**  
I. **1** is no longer needed, so it can be dropped, solving the loop problem, and creating the bridge.  


## Serve  
If you want to serve this at system startup, I recommend using [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/).  
1. ```npm install -g pm2```  
*Note: You may run into an issue where pm2 throws an error when it tries to access a directory that does not exist.  You can simply make the directory in that case.  For example*  
```
mkdir -p /Users/<username>/Library/LaunchAgents/
```

2. ```pm2 startup```  
*Note: Follow the instructions from pm2 - run the command it provides to you.*  


3. Start the server with pm2
```
pm2 start path/to/bridgeCall/server.js --watch
```

4. ```pm2 save```  

5. Unfortunately, this will only start the server once ```<username>``` logs into the mac.  We want it to start at boot, so what I had to do was move the .plist file that was created in ```~/Library/LaunchAgents``` and move it to the system root directory ```/Library/LaunchDaemons```  
*Note: this is not the Library directory that exists under the users directory i.e.*
```
cd /Users/<username>/Library/LaunchAgents/
mv pm2.<username>.plist /Library/LaunchDaemons
```
  
6. I then also had to manually change the UserName in the .plist file to root:
```
  <key>UserName</key>
  <string>root</string>
```
