# Overview

Everything which mobile apps can do can be done via API. You can read & write:

- transactions
- members
- groups
- debts

and more.

We are using [Firebase Realtime Database](https://firebase.google.com/docs/database/) as a backend. You can use any Firebase SDKs to work with the data. This documentation will focus on the REST API. First read [General documentation to Firebase REST API](https://firebase.google.com/docs/database/rest/start).

# Environments

We strongly recommend developing on our sandbox server to minimize impact of errors. Contact us if you want a build of an Android app which is connected to the sandbox server. Or use [sandbox web app](https://settle-up-sandbox-app.web.app/) for creating test groups etc.

## Sandbox

URL: [https://settle-up-sandbox.firebaseio.com](https://settle-up-sandbox.firebaseio.com)  
Web API key: AIzaSyCfMEZut1bOgu9d1NHrJiZ7ruRdzfKEHbk  
Google Client ID: 84712828597-2qtp21av10di421c5d16ib8e5508au03.apps.googleusercontent.com (localhost:3000 is whitelisted there)  
Facebook app ID: 327675517252504

## Live

URL: [https://settle-up-live.firebaseio.com](https://settle-up-live.firebaseio.com)  
Web API key: (test it on sandbox first and then contact us for production API key)

# Authentication

Most of the requests need to be authenticated. We don’t allow unbounded access via a public API, you should authenticate as some Settle Up user. Use [Firebase Authentication](https://firebase.google.com/docs/auth/) to sign in the user and then pass it to the REST API according to [this guide](https://firebase.google.com/docs/database/rest/auth) (section “Firebase ID tokens”).

## Example

The easiest authentication is with email/password auth provider. For example in Javascript and using Firebase Auth library, it’s [just a few lines of code](https://firebase.google.com/docs/auth/web/password-auth#sign_in_a_user_with_an_email_address_and_password).

# Transactions

Transaction is the main unit of data in Settle Up. Transactions can be expenses or transfers (incomes are expenses with negative amounts).

## Sample transaction object

```json
{
   "category":"🍺",
   "currencyCode":"CZK",
   "dateTime":1457015264428,
   "exchangeRates":{
      "EUR":"27.05",
      "USD":"21.70"
   },
   "fixedExchangeRate":false,
   "items":\[
      {
         "amount":"200.33",
         "forWhom":\[
            {
               "memberId":"member\_id\_1",
               "weight":"1"
            },
            {
               "memberId":"member\_id\_2",
               "weight":"2.3"
            }
         \]
      }
   \],
   "purpose":"Pivo",
   "receiptUrl":"http://www.makereceipts.com/receipt\_preview.jpg",
   "type":"expense",
   "whoPaid":\[
      {
         "memberId":"member\_id\_1",
         "weight":"1"
      }
   \]
}
```

### Data items:

- **category**: transaction’s category (emoji)
- **currencyCode**: ISO code of the transaction currency
- **dateTime**: Time of creating transaction in millis
- **exchangeRates**: If group currency is different from transaction currency, exchange rates are needed (optional)
  - Numbers mean “How much is 1 \<CODE\> in transaction currency”
- **fixedExchangeRate**: True if exchange rate is automatic, false if it was modified by the user (optional)
- **amount**: Total amount
- **forWhom**: List of members who spent in this transactions
- **memberId**: Member id from members node
- **weight**: Weight of the member, total amount is split using these weights
- **purpose**: User-visible purpose of the transaction (optional)
- **receiptUrl**: URL to a receipt (optional)
- **type**: "expense" or "transfer"
- **whoPaid**: List of members who paid in this transactions

## Adding a transaction

First you need a valid group with some members. Then send a POST request with the JSON payload similar to the sample one to this URL:

https://\<environment\>.firebaseio.com/transactions/\<group_id\>.json

# Groups

## List of groups

You can get a list of currently signed in user if you GET this URL:

https://\<environment\>.firebaseio.com/userGroups/\<user_id\>.json

Then you receive objects like this:

```json
{
  "group\_id\_1": {
    "order": 1,
    "color": "\#ec1561",
    "member": "member\_id\_1"
  },
  "group\_id\_2": {
    "order": 2,
    "color": "\#00BCD4"
  }
}
```

### Data items:

- **order** is user-defined order of groups
- **color** is user-defined group color
- **member** is “This is me” setting in the app (optional)

## Group details

You can get details of a specific group if you GET this URL:  
https://\<environment\>.firebaseio.com/groups/\<group_id\>.json

Then you receive objects like this:

```json
{
   "ownerColor": "\#f2774a",
   "convertedToCurrency": "EUR",
     "inviteLink": "[https://a3bc5.app.goo.gl/…](https://a3bc5.app.goo.gl/…)"
   "inviteLinkHash": "abcde1",
   "inviteLinkActive": true,
   "minimizeDebts": true,
   "name": "Group name"
}
```

### Data items:

- **ownerColor** is the owner-defined color for users who didn’t override it (in userGroups)
- **convertedToCurrency** is the default currency of the group in which debts are shown
- **inviteLink** is the sharing link used to join the group
- **inviteLinkHash** is a random hash used for security purposes (is part of the inviteLink)
- **inviteLinkActive** specifies if other users can join this group via link
- **minimizeDebts** is an option for our debt algorithm
- **name** is the name of the group

## Create a group

It’s a complex process consisting of many steps:

1. Generate group_id by POST to **/groups** with JSON like

```json
   {
      "ownerColor": "\<hexa of selected color\>",
      "convertedToCurrency": "\<currency based on locale\>",
        "inviteLink": "https://a3bc5.app.goo.gl/?link=https://app.settleup.info/group/\<group\_id\>/join/\<hash\>\&apn=io.stepuplabs.settleup\&utm\_source=dl\&ibi=cz.bioport.SettleUp7\&isi=737534985\&ius=settleup"
      "inviteLinkHash": "\<random alphanum string with 6 chars\>",
      "inviteLinkActive": true,
      "minimizeDebts": true,
      "name": "\<selected name, max 30 chars\>"
   }
```

1. Create permission by PUT at **/permissions/\<group_id\>/\<user_id\>**

```json
{
  "level": 30
}
```

where **level** is 30 for owner, 20 for read-write and 10 for read-only.

3. Create member by POST at **/members/\<group_id\>**

   {  
    "active": true,  
    "defaultWeight": "1",  
    "name": "\<First name of user’s name\>",  
    "photoUrl": "\<user’s photo url\>"  
   }

4. Create userGroup by PUT at **/userGroups/\<user_id\>/\<group_id\>**

   {  
    "order": \<smallest group order \-1, starts at 0\>,  
    "color": "\<hexa of selected color\>",  
    "member": "\<member_id\>"  
   }

5. Update by PUT at **/users/\<user_id\>/currentTabId** so the user sees the group next.

# Permissions

You can get a list of users who have access to a group if you GET this URL:

https://\<environment\>.firebaseio.com/permissions/\<group_id\>.json

Then you receive objects like this:

```json
{
  "\<uid\_1\>": {
    "level": 30
  },
  "\<uid\_2\>": {
    "level": 20
  }
}
```

Each user can have a permission value 10, 20 or 30:

- **10** \- readonly
- **20** \- read-write \- user can add/delete transactions & members but cannot do group-wide operations, such as delete the whole group etc.
- **30** \- owner \- this user can do anything with the group

When you are creating a new group, always first set yourself **owner** permission, only then you can create the **group** object itself.

# Members

## List of members

You can get a list of group’s members if you GET this URL:

https://\<environment\>.firebaseio.com/members/\<groups_id\>.json

Then you receive objects like this:

```json
{
  "member\_id\_1": {
    "active": true,
    "bankAccount": "532224564654/0100",
    "defaultWeight": "1",
    "name": "David",
    "photoUrl": "https://lh3.googleusercontent.com/.../photo.jpg"
  },
  "member\_id\_2": {
    "active": true,
    "defaultWeight": "1",
    "name": "Daria"
  }
}
```

### Data items:

- **active** is “Include this member for new transactions” setting from the app
- **bankAccount** is member’s bank account (optional)
- **defaultWeight** is member’s default weight for new transactions
- **name** is member’s name
- **photoUrl** contains URL of member’s photo (optional)

## Adding a member

Send a POST request with the JSON payload similar to the sample one to this URL:

https://\<environment\>.firebaseio.com/members/\<group_id\>.json

Editing a member  
Send a PUT request with the JSON payload similar to the sample one to this URL:

https://\<environment\>.firebaseio.com/members/\<group_id\>/\<member_id\>.json

# Recurring transactions

## List of recurring transactions

You can get a list of group’s members if you GET this URL:

https://\<environment\>.firebaseio.com/recurringTransactions/\<groups_id\>.json

Then you receive objects like this:

```json
"template\_id\_1": {
      "lastGenerated": 1457015264428,
      "runCount": 3,
      "recurrence": {
         "startDate": 1457015264428,
         "endDate": 1457015264428,
         "timezoneOffsetMillis": 3600000,
         "endCount": 10,
         "period": "daily"
      },
      "template": {
         "currencyCode": "CZK",
         "exchangeRates": {
            "EUR": "27.05"
         },
         "fixedExchangeRate": true,
         "items": \[
         {
               "amount": "200.33",
               "forWhom": \[{
               "memberId": "member\_id\_1",
               "weight": "1"
              }\]
         }\],
         "purpose": "Pivo",
         "receiptUrl": "http://www.makereceipts.com/receipt\_preview.jpg",
         "type": "expense",
         "whoPaid": \[{
               "memberId": "member\_id\_1",
               "weight": "1"
         }\]
      }
   }
}
```

### Data items:

- **lastGenerated** specifies last time a transaction was generated
- **runCount** number of transactions generated using this template
- **template** is the tx template \- compared to transaction data definition, it is missing _dateTime_
- **recurrence** specifies how often & when the transaction is generated
  - **startDate** specifies when generating starts
  - **endDate** specifies when generating ends (optional)
  - **timezoneOffsetMillis** specifies the timezone of the user who created the template
  - **endCount** specifies the max number of transactions to be generated
  - **period** can be daily, weekly, monthly, yearly
  - **weeklySettings** is an array of days when to generate transaction (_mon_, _tue_, _wed_, etc., valid only for weekly period) (optional)
  - **monthlySettings** can be _sameDayOfMonth_, _sameDayOfWeek_, _lastDayOfMonth_

The server is triggered 6x a day (4h apart) and based on the recurrence settings, current time and timezone offset generated given transactions \- it aims to generate them between 1am \- 5am depending on the user’s time zone.

# Debts

You can get a list of group’s debts if you GET this URL:

https://\<environment\>.firebaseio.com/debts/\<groups_id\>.json

Then you receive objects like this:

```json
\[{
      "from": "member\_id\_1",
      "to": "member\_id\_1",
      "amount": "300.50",
}\]
```

# Server tasks

These are triggers for some more complex logic done on the server. When your create them, you will get **taskId** a response.

The API is asynchronous, it can run some time. After it’s processed, you can get the status (ok or error) on this GET:

/serverTasks/\<taskName\>/\<taskId\>/response/code

## Delete group

POST to /serverTasks/deleteGroup.json this JSON:

```json
{
  "request": {
    "groupId": "\<group\_id\>"
  }
}
```

## Delete all transactions

POST to /serverTasks/deleteTransactions.json this JSON:

```json
{
  "request": {
    "groupId": "\<group\_id\>"
  }
}
```

# More

This documentation is not complete. Please let me know what you need at [david@stepuplabs.io](mailto:david@stepuplabs.io) and I will extend it.

# Example integrations

## Stripe

Stripe-Settle Up automatically adds Stripe payments to a Settle Up group, which allows you to run simple accounting in Settle Up.

Code: [https://github.com/cad0p/settleup-stripe](https://github.com/cad0p/settleup-stripe)  
Try it out: [https://stripe-settleup.web.app/](https://stripe-settleup.web.app/)

## Integromat

One of Settle Up fans created a simple Node.js script which is called by Integromat service and adds a monthly revenue statement to his Settle Up group. It’s for personal use only, but the code might be a good inspiration.

Code: [https://gist.github.com/hemisphere81/b3b9e5357b166c6d1b04b2cb9a8d46c8](https://gist.github.com/hemisphere81/b3b9e5357b166c6d1b04b2cb9a8d46c8)

## Up

Up is an Australian bank. Ellis Clayton created an AWS lambda, which automatically adds Up transactions as expenses to Settle Up.

Code: [https://github.com/ellsclytn/up-settle](https://github.com/ellsclytn/up-settle)

## Catchers

Catches is a sport club in Czechia. They integrated Settle Up into their club’s accounting system. They use React and Typescript.

Code: [https://github.com/misak113/catchers/pull/34](https://github.com/misak113/catchers/pull/34)
