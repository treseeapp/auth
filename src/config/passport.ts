import {Usuario} from "../model/Usuario";
import {UsuarioService} from "../service/usuarioService";

let passport = require('passport');
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

require('./Environment');

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