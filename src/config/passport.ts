import {Usuario} from "../model/Usuario";
import {UsuarioService} from "../service/usuarioService";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";

let passport = require('passport');
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
let LocalStrategy = require('passport-local').Strategy;

require('./enviroment');

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
        const usuarioService = new UsuarioService();
        const email = profile.emails[0].value;
        let result;

        console.log(profile)
        result = <any>await usuarioService.findByEmail(email);

        if (result ===  null){
            /*
            * Usuario no existe
            * */
            await usuarioService.createUser({
                idusuario: undefined,
                email: profile.emails[0].value,
                contraseña: null,
                nombre: profile.name.givenName,
                apellidos: profile.name.familyName,
                direccion: null,
                genero: null,
                dataNacimiento: null,
                rol: 1,
                modo_inicio_sesion: 0,
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
            return done(null, false); // Enviar al cb de failure
        } else {
            return done(null, user.email);
        }
    }
));

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
    },
    async function (req: any, email: string, password: string, done: any, error: any) {

        console.log("Probando");

        /*        console.log("Tiene que llegar al local");
                console.log(email);
                console.log(password);

                const service = new UsuarioService();

                // Falta añadir el authMode lo comentamos
                const userToValidate = {
                    email: email,
                    contraseña: password,
                };

                const result = await service.validateUser(userToValidate);

                console.log("Esto el resultado del validateUser= " + result);

                let userValidated;

                if (result) {
                    userValidated = await service.findByEmail(userToValidate.email);
                } else {
                    userValidated = false;
                }

                return done(null, userValidated);*/
    }
));