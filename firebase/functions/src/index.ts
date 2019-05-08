import { Competency } from './model/assessment';
import { SkillProfile } from './model/skill';
import { Assessment } from './../../../mobile/src/app/model/assessment';
import * as func from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as cors from  'cors';
import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { User, Referee } from './model/user';
import { PersistentData } from './model/common';
import { Coaching } from './model/coaching';

admin.initializeApp(func.config().firebase);
const db = admin.firestore();
const gmailEmail = func.config().gmail.email;
const gmailPassword = func.config().gmail.password;

const collectionCoaching = 'coaching';
const collectionAssessment = 'assessment';
const collectionUser = 'user';
const collectionReferee = 'referee';
const collectionSkillprofile = 'skillprofile';

/**
* Here we're using Gmail to send 
*/
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: gmailEmail,
        pass: gmailPassword
    }
});

export const sendCoaching = func.https.onRequest((request, response) => {
    console.log('sendCoaching: request=' + request.method 
        + ', \nheaders=' + JSON.stringify(request.headers, null, 2) 
        + ', \nbody=' + JSON.stringify(request.body, null, 2));
    const corsOptions: any = {
        origin: (origin: string, callback: any) => {
            callback(null, true);
            // ['*', 'https://app.coachreferee.com'],
        },
        optionsSuccessStatus: 200
    }
    cors(corsOptions)(request, response, () => {
        //get token
        const tokenStr = request.get('Authorization');
        if(!tokenStr) {
            throw new Error('Token required');
        }
        const tokenId = tokenStr.split('Bearer ')[1];
        //Verify token
        return admin.auth().verifyIdToken(tokenId)
            .then((decoded: admin.auth.DecodedIdToken) => {
                // console.log('decoded: ' + decoded);
                // load data from datastore
                return loadCoachingData(request, response)
                    .then( (data: CoachingData) => {
                        //Build email
                        const subject = coachingAsEmailSubject(data.coaching);
                        const html = coachingAsEmailBody(data.coaching);
                        const email = {
                            from: gmailEmail,
                            to: data.user.email,
                            subject,
                            html,
                            attachments: [{   
                                filename: toFileName(subject),
                                contentType: 'text/html',
                                content: html
                                }]
                        };
                        //Send email
                        transporter.sendMail(email, 
                            (erro: any) => {
                                if(erro){
                                    return response.send(erro.toString());
                                } else {
                                    return response.send({ error: null});
                                }
                            });
                        return 'ok';
                    }).catch((err: any) => {
                        console.log(err);
                        response.status(500).send({ error: err});
                    })
            })
    });
})

export const sendAssessment = func.https.onRequest((request, response) => {
    console.log('sendAssessment: request=' + request.method 
        + ', \nheaders=' + JSON.stringify(request.headers, null, 2) 
        + ', \nbody=' + JSON.stringify(request.body, null, 2));
    const corsOptions: any = {
        origin: (origin: string, callback: any) => {
            // console.log('sendAssessment: origin=' + origin);
            callback(null, true);
            // ['*', 'https://app.coachreferee.com'],
        },
        optionsSuccessStatus: 200
    }
    cors(corsOptions)(request, response, () => {
        //get token
        const tokenStr = request.get('Authorization');
        if(!tokenStr) {
            throw new Error('Token required');
        }
        const tokenId = tokenStr.split('Bearer ')[1];
        // console.log('sendAssessment: token=' + tokenId);
        //Verify token
        return admin.auth().verifyIdToken(tokenId)
            .then((decoded: admin.auth.DecodedIdToken) => {
                // console.log('decoded: ' + decoded);
                // load data from datastore
                return loadAssessmentData(request, response)
                    .then( (data: AssessmentData) => {
                        //Build email
                        const subject = assessmentAsEmailSubject(data.assessment);
                        const html = assessmentAsEmailBody(data.assessment, data.skillProfile, data.user, data.referee);
                        const email = {
                            from: gmailEmail,
                            to: data.user.email,
                            subject,
                            html,
                            attachments: [{   
                                filename: toFileName(subject),
                                contentType: 'text/html',
                                content: html
                                }]
                        };
                        //Send email
                        transporter.sendMail(email, 
                            (erro: any) => {
                                if(erro){
                                    return response.send(erro.toString());
                                } else {
                                    return response.send({ error: null});
                                }
                            });
                        return 'ok';
                    }).catch((err: any) => {
                        console.log(err);
                        response.status(500).send({ error: err});
                    })
            })
    });
})


//////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////// PRIVATE FUNCTIONS /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

function toFileName(str: String): string {
    return str.replace(',','').replace(':','').replace(' ', '_') + '.html';
}
function to2Digit(nb: number): string {
    return (nb < 10 ? '0' : '') + nb;
}

function loadFromDb(collection: string, id: string, response:any): Promise<PersistentData|null> {
    return db.collection(collection).doc(id).get()
        .then( (doc:DocumentSnapshot) => {
            if (doc.exists) {
                const data = doc.data() as PersistentData;
                data.id = id;
                console.log('loadFromDb(' + collection +', ' + id + ') => ' + data);
                return data;
            } else {
                console.log('loadFromDb(' + collection +', ' + id + ') => null');
                return null;
            }
        }).catch(reason => {
            response.send(reason);
            console.log('loadFromDb(' + collection +', ' + id + ') => ERROR:' + reason);
            return null;
        });
}

const DATE_SEP = '-';


interface AssessmentData {
    assessment: Assessment;
    user: User;
    referee: Referee;
    skillProfile: SkillProfile;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////
// COACHING PRIVATE FUNCTIONS //
//////////////////////////////////////////////////////////////////////////////////////////////////////

interface CoachingData {
    coaching: Coaching;
    user: User;
}

async function loadCoachingData(request:any, response: any): Promise<CoachingData> {
    const coaching: Coaching = await loadFromDb(collectionCoaching, request.body.data.coachingId, response) as Coaching;
    // console.log('coaching=' + JSON.stringify(coaching, null, 2));
    if (coaching) {
        const d: any = coaching.date;
        if (!(d instanceof Date) ) {
            coaching.date = d.toDate();
        }
    }
    const user: User = await loadFromDb(collectionUser, request.body.data.userId, response) as User;
    // console.log('user=' + JSON.stringify(user, null, 2));
    return { coaching, user};
}

function coachingAsEmailBody(coaching: Coaching): string {
    let body = `
    <h1 style='text-align: center;'>Referee Coaching</h1>
    <ul>
      <li> Competition: ${coaching.competition}</li>
      <li> Date: ${getCoachingDateAsString(coaching)}</li>
      <li> Field: ${coaching.field}</li>
      <li> Time slot: ${coaching.timeSlot}</li>
      <li> Game category: ${coaching.gameCategory}</li>
      <li> Game speed: ${coaching.gameSpeed}</li>
      <li> Game skill: ${coaching.gameSkill}</li>
    </ul>`;
    coaching.referees.forEach((referee) => {
      if (referee.refereeShortName) {
        body += `<h2>Referee ${referee.refereeShortName}</h2>`;

        body += `<h3>Positive points</h3>`;
        body += `<ul>`;
        referee.positiveFeedbacks.forEach(positiveFeedback => {
          body += `<li>${positiveFeedback.skillName}: ${positiveFeedback.description}</li>`;
        });
        body += `</ul>`;

        body += `<h3>Axis of improvment</h3>`;
        referee.feedbacks.forEach(feedback => {
          body += `<h4>${feedback.problemShortDesc}</h4>
          <ul>
            <li>Skill: ${feedback.skillName}</li>
            <li>Problem: ${feedback.problemShortDesc}</li>
            <li>Remedy: ${feedback.remedy}</li>
            <li>Outcome: ${feedback.outcome}</li>
            <li>Period: ${feedback.period}</li>
            <li>Improvement during the game: ${feedback.appliedLater}</li>
            <li>Priority: ${feedback.priority}</li>
          </ul>`;
        });

        body += `<h3>Misc</h3>
        upgrade: ${referee.upgrade}, <br>
        rank: ${referee.rank}`;
      }
    });
    return body;
}

function coachingAsEmailSubject(coaching: Coaching): string {
    return `Referee Coaching ${coaching.competition}, ${getCoachingDateAsString(coaching)}, ${
        coaching.timeSlot}, Field ${coaching.field}`;
}
function getCoachingDateAsString(coaching: Coaching) {
    return coaching.date.getFullYear()
      + DATE_SEP + to2Digit(coaching.date.getMonth() + 1)
      + DATE_SEP + to2Digit(coaching.date.getDate());
}


//////////////////////////////////////////////////////////////////////////////////////////////////////
// ASSESSMENT PRIVATE FUNCTIONS //
//////////////////////////////////////////////////////////////////////////////////////////////////////

async function loadAssessmentData(request:any, response: any): Promise<AssessmentData> {
    const assessment: Assessment = await loadFromDb(collectionAssessment, request.body.data.assessmentId, response) as Assessment;
    if (assessment) {
        const d: any = assessment.date;
        if (!(d instanceof Date) ) {
            assessment.date = d.toDate();
        }
    }
    const user: User = await loadFromDb(collectionUser, request.body.data.userId, response) as User;
    const referee: Referee = await loadFromDb(collectionReferee, request.body.data.refereeId, response) as Referee;
    const skillProfile: SkillProfile = await loadFromDb(collectionSkillprofile, request.body.data.skillProfileId, response) as SkillProfile;

    const data: AssessmentData = { assessment, user, referee, skillProfile};
    console.log('skillProfile=' + JSON.stringify(skillProfile, null, 2));
    console.log('assessment=' + JSON.stringify(assessment, null, 2));
    console.log('referee=' + JSON.stringify(referee, null, 2));
    console.log('user=' + JSON.stringify(user, null, 2));
    return data;
}

function assessmentAsEmailBody(assessment: Assessment, profile: SkillProfile, coach: User, referee: Referee): string {
    let body = `<!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
        <style>
            body { margin: 0 20px;}
            table { width: 100%; }
            table, th, td {
                border: 1px solid black;
                border-collapse: collapse;
            }
            td {
                padding: 5px;
            }
            .title {
                text-align: center; 
                background-color:${profile.backgroundColor}; 
                color:${profile.color}; 
                width: 100%;
            }
            .assessment-header {}
            .assessment-main {}
            .section-name, .global-title {
                background-color: #cccccc;
                font-size: 1.1em;
                font-weight: bold;
                padding: 5px;
            }
            .section-competency, .skill-competency{
                padding: 5px 15px;
                text-align: center;
            }
            .section-competency {
                font-weight: bold;
            }
            .skill-name {
                padding: 5px;
            }
            .assessment-global {}
            .global-main{
                padding-top: 10px;
                padding-bottom: 30px;
            }
        </style>
    </head>
    <body>    
    <table class="assessment-header">
      <tr><td colspan="3" class="title"><h1>${assessment.profileName} Referee Assessment</h1></td></tr>
      <tr><td colspan="2"><strong>Referee:</strong> ${referee.firstName} ${referee.lastName} ${assessment.refereeShortName}</td><td><strong>Referee NTA:</strong> ${referee.country}</td></tr>
      <tr><td colspan="2"><strong>Competition:</strong> ${assessment.competition}</td><td><strong>Date:</strong> ${getAssessmentDateAsString(assessment)}</td></tr>
      <tr><td><strong>Game category:</strong> ${assessment.gameCategory}</td><td><strong>Game speed:</strong> ${assessment.gameSpeed}</td><td><strong>Game skill:</strong> ${assessment.gameSkill}</td></tr>
    </table>`;

    body += `<table class="assessment-main">`;
    assessment.skillSetEvaluation.forEach( (skillSetEval) => {
        body += `<tr class="assessment-section">`;
        body += `<th class="section-name">${skillSetEval.skillSetName}`;
        if (skillSetEval.comment && skillSetEval.comment !== '-') {
            body += `<br>Comment: ${skillSetEval.comment}`;
        }
        body += `</th>`;
        body += `<td class="section-competency">${competency2str(skillSetEval.competency)}</td>`;
        body += `</tr>\n`;
        skillSetEval.skillEvaluations.forEach( (skillEval) => {
            body += `\t<tr><td class="skill-name">${skillEval.skillName}`
            if (skillEval.comment && skillEval.comment !== '-') {
                body += `<br>Comment: ${skillEval.comment}`;
            }
            body += `</td><td class="skill-competency">${competency2str(skillEval.competency)}</td></tr>\n`;
        });
    });
    body += `</table>\n`;
    body += `<table class="assessment-global">`;
    body += `<tr><th class="global-title">Conclusion</th>\n`;
    body += `<tr><td class="global-main">The referee coach ${coach.firstName} ${coach.lastName} declares the referee is ${assessment.competency === 'YES' ? '' : '<strong>NOT</strong> '}competent for the level ${assessment.profileName}.`
    if (assessment.comment && assessment.comment !== '-') {
        body += `<br>Comment: ${assessment.comment}`;
    }
    body += `</td></th>\n`;
    body += `</table>`;
    body += `</body></html>`;

    return body;
}

function competency2str(comp: Competency): string {
    if (comp === 'YES') {
        return 'Yes';
    } else if (comp === 'NO') {
        return 'No';
    } else {
        return ''
    }
}

function assessmentAsEmailSubject(assessment: Assessment): string {
    return `Referee Assessment ${assessment.competition} ${assessment.profileName} ${getAssessmentDateAsString(assessment)} ${assessment.refereeShortName}`;
}

function getAssessmentDateAsString(assessment: Assessment) {
    return assessment.date.getFullYear()
      + DATE_SEP + to2Digit(assessment.date.getMonth() + 1)
      + DATE_SEP + to2Digit(assessment.date.getDate());
}
