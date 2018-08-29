# Quick Start

## Documentation de serverless
https://serverless.com

## Installation de node.js
https://nodejs.org/en/

## Installation de la CLI AWS pour windows
http://docs.aws.amazon.com/fr_fr/cli/latest/userguide/awscli-install-windows.html

## Installation de la CLI Serverless
https://serverless.com/framework/docs/providers/aws/guide/installation/
npm install -g serverless

## Récupération du projet depuis code commit
git clone https://git-codecommit.eu-west-1.amazonaws.com/v1/repos/AWS_Lambda_Project_Template
cd AWS_Lambda_Project_Template

## Installation des dépendances
npm install

## Déployer le template
npm run deploy
ou
serverless deploy --alias=dev --region eu-west-1



# Projet ServerLessSkeleton

Ce projet est un projet exemple de backend fait à base de AWS Lambda exposées via API GW.
L'application utilise aussi une base de données DynamoDB.
L'application est aussi capble de fonctionner en local (offline), sans connexion à AWS.

## 1 - L'application exemple

### 1.1 - Principe d'organisation du code source

Le projet regroupe plusieurs lambda formant un groupe fonctionnel cohérent.
Chaque lambda est dans un fichier dont le nom est src/\<domaine\>/lambda-xxx.js
Le projet montre aussi l'usage d'une librairie src/user/lib-user.js  C'est un moyen de factoriser du code entre lambda.

Le fichier package.json liste les dépendances et contient des commandes minimales pour initialer l'application et la faire fonctionner en local.
Le fichier serverless.yml contient la déclaration des ressources AWS (Lambda, exposition des lambda, dynamodb ...)

### 1.2 - Description de l'application

L'application permet de faire d'appeler un service REST hello, implanté par la lambda lambda-hello.js. Pour appeler cette lambda il faut au préalable s'etre authentifier avec login/password. L'authentification s'effectue en appelant la lambda lambda-authentification.js et renvoie le token a passer dans le header dans l'appel à Hello.
La creation d'utilisateur est ouverte via la lambda-adduser.js

### 1.3 - Comment lancer le backend en local ?

#### 1.3.1 A faire la première fois

0) Configurer ses credentials AWS
  * Creer le fichier ~/.aws/config contenant :

    [default]
    region = eu-west-1

  * Creer le fichier ~/.aws/credentials contenant :

    [default]
    aws_access_key_id = <votre access id>
    aws_secret_access_key = <votre access key>

  * Vous devez avoir installer [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/installing.html) .

1) Installer les dépendances nodes:  yarn install   (ou npm install)
2) Creer le répertoire de stockage la BD: /tmp/DynamoDB/myproject
3) Installer la base de données: npm run installDB
4) Initialiser la base de données: npm run initDB   (Arreter le serveur en faisant Ctr+C)

En cas de plantage à la l'étape 3 faites: npm run resetDB
En cas de plantage à la l'étape 4 ou pour vider la base de données, supprimer simplement le contenu de /tmp/DynamoDB/myproject et relancer npm run initDB.
Le répertoire de stockage de la BD peut etre modifié en changeant les scripts se trouvant dans package.json


#### 1.3.1 A faire pour lancer le backend

1) Lancer la base de données: npm run runDB
2) Lancer le backend node: npm run runNode


### 1.4 - Comment appeler la lambda addUser ?

Envoyer une requete POST à l'url http://localhost:3000/adduser
avec les headers suivants :

    "x-api-key":"AAAABBBB"
    "Content-Type":"application/json"

Et le body suivant :

    { 
      "login": "Seb",
      "password": "123456"
    }
La réponse attendue :

    {
      "id": "Seb"
    }


### 1.5 - Comment appeler la lambda authentication ?

Envoyer une requete POST à l'url http://localhost:3000/authentication
avec les headers suivants :

    "x-api-key":"AAAABBBB"
    "Content-Type":"application/json"

Et le body suivant :

    { 
      "login": "Seb",
      "password": "123456"
    }
En réponse :

### 1.5 - Comment (re)deployer ?

* Creer une API Key
* Creer un Usage Plan
* Associer l'API key à l'Usage Plan
* Ajouter l'API stage 'dev' à l'Usage Plan
* lancer la commande serverless deploy --region eu-west-1

Pour supprimer serverless remove --region eu-west-1

A chaque redéploiement de toute l'application, il faut Ajouter l'API stage 'dev' à l'Usage Plan

Pour redeployer juste une fonction: serverless deploy function --function hello



## 2 - How to dev

Ce document décrit la manière de développer sur le projet

### 2.1 - Comment ajouter un service dans le backend ?

1- Creer le fichier src/\<domaine\>/lambda-\<fonction\>.js
2- Déclarer la fonction dans le fichier serverless.yml avec son exposition (http avec autorizer)
3- Relancer le serveur node pour prendre en compte les modifications du fichier serverless.yml


### 2.3 - Comment acceder au body d'une requete ?

Dans l'exemple la lambda hello est en mode proxy. Ceci permet d'avoir automatiquement les informations de contexte. Ceci implique que le body est stringifié en entrée et doit l'etre en sortie.
Ainsi en début de fonction, pour acceder au body d'une requete POST, il faut donc faire :

    const body = JSON.parse(event.body);

Le retour de la function doit aussi etre stringifié :

    const success = (body) => {
        let res = {
            statusCode: '200',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body) // body response must be stringified due to the Proxy mode of the Lambda
        }
        callback(null, res);
    };


### 2.3 - Comment securiser l'access à un service REST exposé par le backend ?

L'exemple ci-dessous déclare la fonction toto en GET

  toto:
    handler: src/user/lambda-toto.handler
    name: cuicuizz-toto-${self:provider.stage}
    description: Toto is the best
    events:
      - http:
          path: toto
          method: get
          cors: true
          private: true
        authorizer:    # An AWS API Gateway custom authorizer function
          name: myauthorizer # The name of the authorizer function (must be in this service)
          resultTtlInSeconds: 30
          identitySource: method.request.header.authorizationToken
          identityValidationExpression: '^Bearer [-0-9a-zA-z\.]*$'

QQ précisions sur cette exemple :

- La section 'handler' défini le fichier JS qui contient la fonction exportée sous le nom handler
- la section 'method' défini la methode HTTP d'exposition du service (get, post, del, any ...)
- la section 'cors' active les cors pour cette ressource web
- La section 'private' à true indique que l'appel au service necessite de fournir une clé dans le header de la requete http. En local la cle est passée au démarrage du server node (voir backend/package.json). En AWS, la clé est spécifier dans la console AWS.
- La section 'authorizer' impose l'appel d'une lambda (authorizer) pour vérifier le token web devant se trouver dans le champ 'authorizationToken' du header de la requete web.
- authorizer.name fait référence à la lambda authorizer utilisée sur le projet pour valider les tokens. Le token est obtenu lors de la phase de login.

Dans l'implementation de la fonction metier (ex hello), il possible de récupérer des données venant du Token. C'est l'authorizer qui décode le token et place des données dans le contexte d'execution de la fonction metier. Pour une lambda en mode proxy (ex: hello), les données fournies par un authorizer sont disponibles dans la variable: event.requestContext.authorizer.*
Dans l'exemple hello c'est ainsi qu'on récupère le login et le profile de l'utilisateur.

## 3 - Statut du template de projet

### 3.1 - Ce qui fonctionne

- Utilisation de serverless
- Fonctionnement en local : Lambda exposé en Http via API GW
- Fonctionnement en locat : DynamoDB (creation des schemas, peuplement initial)
- Fonctionnement en local : Securisation des appels Lambda avec un authorizer et transmission des données en provenance du Token
- Fonctionnement en local : Securisation des appels Lambda avec API key dans les lambdas (Une seule API Key par run fourni en param du run)


### 3.2 - Ce qui ne fonctionne pas / n'existe pas

- Fonctionnement en local : Déclenchement en local d'un Lambda par un message SNS
- Fonctionnement en local : Déclenchement de lambda via un événement d'un S3 local


### 3.3 - Ce qu'il faudrait tester

- Fonctionnement en local : Acces à S3 en local
- TypeScript : ecrire une lambda en TypeScript avec le transpileur babel
