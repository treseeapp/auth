import {UsuarioService} from "../service/UsuarioService";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";
import * as passport from "passport";
import * as passportGoogle from 'passport-google-oauth2';
import * as localPassport from "passport-local";
import {Rol} from "../model/enum/Rol";


const GoogleStrategy = passportGoogle.Strategy;
const LocalStrategy = localPassport.Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
require('./enviroment');

passport.serializeUser(function (user: any, done: any) {
    done(null, user);
});

passport.deserializeUser(function (obj: any, done: any) {
    done(null, obj);
});


/*
* Implementacion de las estrategias
* */
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
        passReqToCallback: true
    },
    async function (request: any, accessToken: string, refreshToken: string, profile: any, done: any) {
        const usuarioService = new UsuarioService();

        const emailGoogle = profile.email;

        let result;

        result = <any>await usuarioService.findByEmail(emailGoogle);

        if (result === null) {
            /*
            * Usuario no existe
            * */
            await usuarioService.createUser({
                email: emailGoogle,
                contraseña: '',
                nombre: profile.given_name,
                apellidos: profile.family_name,
                rol: Rol.ESTUDIANTE,
                modo_inicio_sesion: ModoInicioSesion.GOOGLE,
                foto_perfil: process.env.IMAGE_PROFILE_DEFAULT
            });

            result = <any>await usuarioService.findByEmail(emailGoogle);
        }
        const user = result.dataValues;

        /*
        * Sacamos el modo de inicio de sesion
        * Solo dejamos logear si en modo de inicio de sesion es google
        * */
        const authMode = ModoInicioSesion[user.modo_inicio_sesion];

        if (authMode.toLowerCase() !== 'google') {
            return done(null, false); // TODO Enviar al cb de failure
        } else {
            return done(null, user);
        }
    }
));

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'email', 'first_name', 'middle_name', 'last_name']
    },
    async function (accessToken: string, refreshToken: string, id: any, profile: any, done: any) {

        console.log("Lleva al callback de facebook");

        const usuarioService = new UsuarioService();
        const emailFacebook = profile.emails[0].value;
        console.log(emailFacebook);

        let result;

        result = <any>await usuarioService.findByEmail(emailFacebook);

        if (result === null) {
            /*
            * Usuario no existe
            * */
            await usuarioService.createUser({
                email: emailFacebook,
                contraseña: '',
                nombre: profile.name.givenName,
                apellidos: profile.name.familyName,
                rol: Rol.ESTUDIANTE,
                modo_inicio_sesion: ModoInicioSesion.FACEBOOK,
                foto_perfil: process.env.IMAGE_PROFILE_DEFAULT
        });

            result = <any>await usuarioService.findByEmail(emailFacebook);
        }
        const user = result.dataValues;

        /*
        * Sacamos el modo de inicio de sesion
        * Solo dejamos logear si en modo de inicio de sesion es google
        * */
        const authMode = ModoInicioSesion[user.modo_inicio_sesion];

        if (authMode.toLowerCase() !== 'facebook') {
            return done(null, false); // TODO Enviar al cb de failure
        } else {
            return done(null, user);
        }
    }));

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async function (req, email, password, cb) {

    console.log("Mi req: ", req.body);

    /*
    * Validar usuario
    * */
    const service = new UsuarioService();
    const userToValidate = {
        email: req.body.email,
        contraseña: req.body.password,
    };

    const result = await service.validateUserLocal(userToValidate);

    let userValidated;
    if (result) {
        userValidated = await service.findByEmail(userToValidate.email);
    } else {
        userValidated = false;
    }

    return cb(null, userValidated);
}));



