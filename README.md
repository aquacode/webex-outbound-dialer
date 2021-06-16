# bridgeCall
Add an unregistered SIP device to a Webex call

Requirements:  
MacOS 10.15 (Catalina)  
Node.js version 12 or above

## Environment Variables (Required)
```
export PORT=12345 #(the port your server listener will expose)
```

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
POST https://localhost:12345/bridge
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

