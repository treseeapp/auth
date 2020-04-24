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
      steps {
        sh 'docker build -t auth-node .'
      }
    }

  }
}