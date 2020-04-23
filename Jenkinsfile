pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh '''echo "BUILD"
npm i
npm run build
docker build -t auth-node .
docker stop auth
docker container rm auth
docker run -d --name auth -p 3000:3000 auth-node'''
      }
    }

  }
}