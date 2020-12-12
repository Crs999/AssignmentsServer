import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import userRepo from './repository'
import {jwtConfig} from "../utils";

export const  router=new Router();

const createToken=(user)=>{
    return jwt.sign({username:user, _id:user._id,},
        jwtConfig.secret, { expiresIn: 1800000 })
}


const createUser=async (user, response)=>{
    try{
        await pupilsRepo.insert(user);
        response.body={token:createToken(user)};
        response.status=201;
    }catch(err){
        response.body={issue:[{error:err.message}]};
        response.status=400;
    }
};

router.post('/signup', async(context)=> await createUser(context.request.body, context.response));

router.post('/login', async(context)=>{
   const credentials=context.request.body;
   const response=context.response;
   const user=await userRepo.findOne({username:credentials.username});
   if(user && credentials.password===user.password){
       response.body={token: createToken(user)};
       response.status=201;
   }else{
       response.body={issue:[{error:'Invalid credentials'}]};
       response.status=400;
   }
});


