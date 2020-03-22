import {OK, BAD_REQUEST, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Middleware, Get, Post} from '@overnightjs/core';
import {Request, Response} from 'express';

import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as bcrypt from "bcrypt";

require('../config/Environment');
require('../config/Passport');

@Controller('auth/')
export class LoginController {


}