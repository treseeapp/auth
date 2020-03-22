import {Usuario} from "../model/Usuario";
import {UsuarioService} from "../service/usuarioService";

let passport = require('passport');
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
let LocalStrategy = require('passport-local').Strategy;

require('./Environment');

passport.serializeUser(function (user: any, done: any) {
    done(null, user);
});

passport.deserializeUser(function (obj: any, done: any) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async function (accesToken: string, refreshToken: string, profile: any, done: any) {

        let usuarioService = new UsuarioService();
        let user = new Usuario();

        // Asignamos al usuario creado los valores correspondiente obtenido del Token


        // Creamos el usuario si no existe con el usuarioService y lo devolvemos al endpoint

        return done(null, user.email);

    }
));

passport.use(new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true,
    },
    async function(req: any, email: string, contraseña: string, done:any, error: any) {
        return done(null, true);
    }
));