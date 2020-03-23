import {UsuarioService} from "../service/UsuarioService";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";
import * as passport from "passport";
import * as passportGoogle from 'passport-google-oauth2';
import * as localPassport from "passport-local";
import {Rol} from "../model/enum/Rol";
import {Genero} from "../model/enum/Genero";


const GoogleStrategy = passportGoogle.Strategy;
const LocalStrategy = localPassport.Strategy;
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
    async function (request: any, accessToken: string, refreshToken: string, profile: any, birthdate: any, done: any) {
        const usuarioService = new UsuarioService();
        const email = profile.email;
        let result;

        console.log(accessToken);
        console.log(refreshToken);
        console.log(profile);
        console.log("Esto tiene que serl cumple:");
        console.log(birthdate);
        result = <any>await usuarioService.findByEmail(email);

        if (result === null) {
            /*
            * Usuario no existe
            * */
            await usuarioService.createUser({
                email: profile.emails[0].value,
                contraseña: '',
                nombre: profile.givenName,
                apellidos: profile.familyName,
                direccion: '',
                genero: Genero.INDEFINIDO,
                dataNacimiento: '',
                rol: Rol.ESTUDIANTE,
                modo_inicio_sesion: ModoInicioSesion.GOOGLE,
                foto_perfil: profile.photos[0].value
            });

            result = <any>await usuarioService.findByEmail(email);
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



