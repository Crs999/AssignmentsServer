import Router from 'koa-router';
import assignmentRepo from './repository'
import {broadcast} from "../utils";

export const router=new Router();
router.get('/', async (context)=>{
    const response=context.response;
    let pupilID=context.state.user._id;
    // console.log(await assignmentRepo.find({pupilID: pupilID}))
    response.body=await assignmentRepo.find({pupilID: pupilID});
    response.status=200;
});

const createAssignment=async(context, assignment, response)=>{
  try {
      let userID=context.state.user._id;
      assignment.pupilID = userID
      let respAsign = await assignmentRepo.insert(assignment);
      response.body=respAsign
      response.status = 201;
      assignment._id=respAsign._id;
      broadcast(userID, {type: 'created', payload: assignment});
  }catch(err){
      response.body={message:err.message};
      response.status=400;
  }
};

router.post('/', async context=>{
    await(createAssignment(context, context.request.body, context.response))});

router.put('/:id', async(context)=>{
   const assignment=context.request.body;
   const id=context.params.id;
   const assignmentID=assignment._id;
   const response=context.response;
   if(assignmentID && assignmentID!==id){
       response.body={message: "The assignment ID and the parameter ID should be the same!!!"}
       response.status=400;
   }
   if(!assignmentID){
       await createAssignment(context, assignment,response);
   }else{
       assignment.pupilID=context.state.user._id;
       const updatedCount=await assignmentRepo.update({_id:id},assignment);
       if(updatedCount===1){
           response.body=assignment;
           response.status=200;
       }else{
           response.body={message:'Assignment no longer exists'};
           response.status=405;
       }
   }
});

router.put('/conflict/:id', async(context)=>{
    const assignment=context.request.body;
    const userID=context.state.user._id
    const id=context.params.id;
    const response=context.response;
    assignment.pupilID=userID
    assignment.version=new Date().toUTCString()
    const updatedCount=await assignmentRepo.update({_id:id},assignment);
    if(updatedCount===1){
        response.body=assignment;
        response.status=200;
        broadcast(userID, {type: 'resolvedConflict', payload: assignment});
    }else{
        response.body={message:'Assignment no longer exists'};
        response.status=405;
    }
});

router.get('/conflict/:id', async (context)=>{
    const response=context.response;
    let pupilID=context.state.user._id;
    let id=context.params.id
    let version=context.header['if-modified-since']
    let serverAssignment=await assignmentRepo.findOne({_id:id});
    if(Date.parse(serverAssignment.version)>=Date.parse(version)){
        response.status=200
        response.body=serverAssignment
    }else{
        response.status=304
    }

});

router.post('/sync', async(context)=>{
    const localAssignments=context.request.body;
    const userID=context.state.user._id;
    const response=context.response;
    let versionConflicts=[];
    for(let i=0;i<localAssignments.length;i++) {
        let localAssign = localAssignments[i];
        localAssign.pupilID = userID;
        let inRepo = await assignmentRepo.findOne({_id: localAssign._id});
        if (localAssign._id.startsWith("_") && !inRepo) {
            localAssign._id=undefined;
            await assignmentRepo.insert(localAssign)
        } else {
            if (inRepo && (inRepo.lng!==localAssign.lng || inRepo.lat!==localAssign.lat || inRepo.photoURL!==localAssign.photoURL || inRepo.description !== localAssign.description || inRepo.title !== localAssign.title || inRepo.date !== localAssign.date)) {
                let inRepoVersion=Date.parse(inRepo.version)
                let localVersion=Date.parse(localAssign.version)
                if(inRepoVersion>=localVersion) versionConflicts.push(localAssign._id)
                else await assignmentRepo.update({_id: localAssign._id}, localAssign)
            }
        }
    }
    if(versionConflicts.length>0){
        response.body=versionConflicts
        response.status=409
    }else{
        response.body=versionConflicts
        response.status=201
    }

});

router.del('/:id', async(context)=>{
   const userID=context.state.user._id;
   const assignment=await assignmentRepo.findOne({_id: context.params.id});
   if(assignment && userID !== assignment.pupilID){
       context.response.status=403;
   }else{
       await assignmentRepo.remove({_id:context.params.id});
       context.response.status=204;
   }
});