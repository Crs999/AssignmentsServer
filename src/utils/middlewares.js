export const exceptionHandler=async(context, next)=> {
    try {
        return await next();
    } catch (err) {
        context.body = {message: err.message || "Unexpected error!"};
        context.status = err.status || 500;
    }
};


export const timingLogger= async (context, next)=>{
    const start=Date.now();
    await next();
    console.log(`${context.method} ${context.url} => 
        ${context.response.status}, ${Date.now()-start}ms`);
}