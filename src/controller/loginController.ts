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


    @Get('google')
    @Middleware(passport.authenticate('google', {scope: ['profile', 'email']}))
    private loginGoogle(req: Request, res: Response) {
        res.end();
    }

    @Get('google/callback')
    @Middleware(passport.authenticate('google'))
    private loginGoogleCallBack(req: Request, res: Response) {

        // Demomento solo guardamos el correo en el token
        const accessToken = jwt.sign({user: req.user}, <string>process.env.TOKEN_SECRET_KEY, {
            expiresIn: process.env.ACCES_TOKEN_EXPIRE,
        });

        const refreshToken = jwt.sign({user: req.user}, <string>process.env.TOKEN_SECRET_KEY, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        });

        // Habrá que modificar la ruta si es otra más adelante
        res.redirect(301, process.env.FRONTEND_URL + '/#/admin/?accessToken=' + accessToken + "&refreshToken=" + refreshToken);
    }

}