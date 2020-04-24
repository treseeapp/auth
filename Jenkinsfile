pipeline {
  agent any
  stages {
    stage('Instalamos dependencias') {
      steps {
        sh  '''  echo "Instalamos dependencias"
                 npm i
            '''
      }
    }

    stage('Compilamos') {
      steps {
        sh  '''
            echo "Compilamos "
            npm run build
            '''
      }
    }

    stage('Construimos la imagen docker') {
      when{
        branch 'Produccion'
      }
      steps {
        sh  '''
            pwd
            ls -la
            docker build -t auth-node .
            '''
      }
    }

    stage('Deploying image docker'){
        when{
            branch 'Produccion'
        }
        steps  {
            sh  '''
                docker stop auth
                docker container rm auth
                docker run -d --name auth -v /jenkinsCredentials/.env:/usr/src/node/.env --network host auth-node
                '''
        }
    }

    stage('Deploying to docker hub'){
        when{
            branch 'Produccion'
        }
        steps  {
            echo "subimos a docker hub"
        }
    }
  }
}