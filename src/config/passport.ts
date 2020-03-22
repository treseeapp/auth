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

        console.log("Llega aquiii");

        console.log(profile);
        console.log(profile.emails[0].value);

        let usuarioService = new UsuarioService();

        /*
        Supongo que el createUser ya controla si este usuario ya existe
        ahora no sé si en Spring tenemos puesto unique hay que mirarlo
        */

        /*
        No lo he mirado mucho pero diria que la fecha de nacimiento, el genero
        y la dirección no podemos obtenerla. Deberemos completarla en el
        panel de editar el perfil.
        */

        await usuarioService.createUser({
            idusuario: undefined,
            email: profile.emails[0].value,
            contraseña: null,
            nombre: profile.name.givenName,
            apellidos: profile.name.familyName,
            direccion: null,
            genero: 0,
            dataNacimiento: "2005-00-00",
            rol: 0,
            modo_inicio_sesion: 0,
            foto_perfil: profile.photos[0].value
        });

        return done(null, profile.emails[0].value);

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