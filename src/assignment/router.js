import Router from 'koa-router';
import assignmentRepo from './repository'
import {broadcast} from "../utils";


export const router=new Router();

router.get('/', async (context)=>{
    const response=context.response;
    const pupilID=context.state.user._id;
    response.body=await assignmentRepo.find({pupilID:pupilID});
    response.status=200;
});

router.get('/:id', async(context)=>{
   const pupilID=context.state.user._id;
   const assignment=await assignmentRepo.findOne({_id: context.params.id});
   const response=context.response;
   if(assignment){
       if(assignment.pupilID===pupilID){
           response.body=assignment;
           response.status=200;
       }else {
           response.status = 403;
       }
   }else{
       response.status=404;
   }
});


const find=(assignments, assignment)=>{
    for(let i=0;i<assignments.length;i++)
        if(assignments[i]._id===assignment._id)
            return true;
    return false;
}

const createAssignment=async(context, assignment, response)=>{
  try {
      let userID=assignment.pupilID
      assignment.pupilID = context.state.user._id;
      response.body = await assignmentRepo.insert(assignment);
      response.status = 201;
      broadcast(userID, {type: 'created', payload: assignment});
  }catch(err){
      response.body={message:err.message};
      response.status=400;
  }
};

router.post('/', async context=>
    await(createAssignment(context, context.request.body, context.response)));

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
       const userID=context.state.user._id;
       assignment.pupilID=userID;
       const updatedCount=await assignmentRepo.update({_id:id},assignment);
       if(updatedCount===1){
           response.body=assignment;
           response.status=200;
           broadcast(userID, {type: 'updated', payload: assignment});
       }else{
           response.body={message:'Assignment no longer exists'};
           response.status=405;
       }
   }
});

router.post('/sync', async(context)=>{
    const localAssignments=context.request.body;
    const userID=context.state.user._id;
    const response=context.response;
    let updateNumber=0
    for(let i=0;i<localAssignments.length;i++) {
        let localAssign = localAssignments[i];
        localAssign.pupilID = userID;
        let inRepo = await assignmentRepo.findOne({_id: localAssign._id});
        if (localAssign._id.startsWith("_") && !inRepo) {
            updateNumber += await assignmentRepo.insert(localAssign)
        } else {
            if (inRepo && (inRepo.description !== localAssign.description || inRepo.title !== localAssign.title || inRepo.date !== localAssign.date)) {
                updateNumber += await assignmentRepo.update({_id: localAssign._id}, localAssign)
            }
        }
    }
    response.body=true
    response.status=201
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