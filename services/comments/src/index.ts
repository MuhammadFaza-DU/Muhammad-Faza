import {handleRequest} from "./api.ts";
import type {CommentsEnv} from "./types.ts";

export default {fetch:(request:Request,env:CommentsEnv)=>handleRequest(request,env)};
