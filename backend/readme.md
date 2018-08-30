# Projet RefCoach Backend

This application RefCoach backend permits to share and persist referee coaching information.
It exposes and stores the following resources :

- User: the user of the application
- Referee: the shared  database of the referees
- Skill Profile: a set of common Skill Profile to assess the referees
- Assessment: the referee assessment database done by referee coaches.
- Coaching: the referee coaching feedback database done by referee coaches

From a technology point of view this backend is build on top of AWS Lambda exposed via API GW. 
The Lambda function are developed in JavaScript.
The persistency of the data is made with AWS DynamoDB.
This project use serverless framework.

For a testing purpose this backend can work in offline mode.

For more details about the APIs open the Swagger file.

## 1 - Installation

### 1.1 - Requirements

- [Serverless](https://serverless.com)
- [Node.js](https://nodejs.org/en/)
- [AWS CLI for windows](http://docs.aws.amazon.com/fr_fr/cli/latest/userguide/awscli-install-windows.html)
- [CLI Serverless](https://serverless.com/framework/docs/providers/aws/guide/installation/)

### 1.2 - Fetch sources and dependancies

Get projet from GitHub
```
git clone https://github.com/schassande/referee-coaching.git
cd referee-coaching
npm install
```

## 2 - Deploy on you AWS Account

This section desribes how to deploy the baskend on your AWS Account.

### 2.1 Configure your AWS account

Configure  AWS credentials
1) Create file ~/.aws/config with the following content:
    ```
    [default]
    region = eu-west-1
    ```

2) Create file ~/.aws/credentials with the following content:

    ```
    [default]
    aws_access_key_id = <votre access id>
    aws_secret_access_key = <votre access key>
    ```

Don't forget to install [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/installing.html).


## 2.2 Deploy the application

`npm run deploy` or `serverless deploy --alias=dev --region eu-west-1`

## 2.3 Create API key

1) Connect to the AWS console.
2) Go to API Gateway service
3) Create an API Key. Suggested named: `REFCOACH`

## 2.4 Create Plan

1) Connect to the AWS console.
2) Go to API Gateway service
3) Create an Usage Plan
4) Associate the API key to the usage plan
5) Add the API stage to the usage plan

WARNING: Each type the application is deployed, the API stage must be associated to the usage plan

## 3 - Work in locally in offline mode

### 3.1 To do the first time

1) Configure your AWS account as describe in section 2.1
2) Create storage directory: `/tmp/DynamoDB/refcoach`. If you want to change the storage directory, you have to updage the package.json file (scripts section)
3) Run a script to install the database: `npm run installDB`
4) Run a script to install the database: `npm run initDB`

Note: If you need to restart the procedure simply drop the content of the storage directory.

### 3.2 Launch the backend

1) Launch the database: `npm run runDB`
2) In another window/tab, Launch Node: `npm run runNode`

To stop, simply make a `Ctrl+C`

### 3.3 - Call a function to add a user

Send a POST request (with Postman for instance) to the url: `http://localhost:3000/user`
with the following header fields:

    "x-api-key":"2O3I4U928U349F82N3948D923U932F"
    "Content-Type":"application/json"

And the following body content:

    {
      "email": "Seb",
      "password": "123456"
    }

The expected answer is the following:

    {
      "id": "Seb"
    }

### 3.4 - Call the lambda about user authentication

Send a POST request to `http://localhost:3000/user/login` with the following header fields:

    "x-api-key":"2O3I4U928U349F82N3948D923U932F"
    "Content-Type":"application/json"

And the following body content:

    { 
      "email": "Seb",
      "password": "123456"
    }
As answer you should receive a JWT token.

## 4 - Development

### 4.1 - Secure access to REST function

The exemple below declares a function name toto from the `lambda-toto.js` file and exposes at the url `/toto` to a GET http call.

```
  toto:
    handler: src/user/lambda-toto.myfunction
    name: cuicuizz-toto-${self:provider.stage}
    description: Toto is the best
    events:
      - http:
          path: /toto
          method: get
          cors: true
          private: true
        authorizer:    # An AWS API Gateway custom authorizer function
          name: authorizer # The name of the authorizer function (must be in this service)
          resultTtlInSeconds: 30
          identitySource: method.request.header.Authorization
          identityValidationExpression: '^Bearer [-0-9a-zA-z\.]*$'
```

Explantions:

- the `handler` defines the JS file containing the exposed function (`exports.myfunction = ...`)
- The section `method` defines the Http method of the function. Possible values are: get, post, delete, any
- the section `cors` activate cors for this web resource.
- the section `private` to true indicate the call to the web service requires an API key as header field of the Http request. In offline mode the API key is defined at noder server start (see `backend/package.json`, scripts section). In online mode (AWS), the key is defined in the AWS console.
- the section `authorizer` defines the name of the lambda authorizer in charge of checking the web token (JWT) expected in header field `Authorization` of the Http request. The token is fetched during login step.
- `authorizer.name` is the name of the lambda function
