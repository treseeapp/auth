pipeline {
  agent {
    docker {
      image 'node:13.12.0-strech'
      args '-p 3000:3000'
    }

  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install'
      }
    }

  }
}