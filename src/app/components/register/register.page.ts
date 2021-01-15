import { UserInterface } from 'src/app/models/user.interface';
import { Observable } from 'rxjs';
// register.page.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FirestorageService } from '../../services/firestorage.service';
import { FirestoreService } from '../../services/firestore.service';
import { ToastController } from '@ionic/angular';
import firebase from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import * as CryptoJS from 'crypto-js';
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  newFile: '';
  newImage: '';
  segment1: boolean;
  segment2: boolean;
  user: UserInterface = {
    uid: '',
    name: '',
    email: '',
    photo: '',
    password: '',
    emailVerified: false,
  };

  constructor(
    public firestoreService: FirestoreService,
    public authSvc: AuthService,
    private router: Router,
    public fireStorageService: FirestorageService,
    public toastController: ToastController,
    public fireAuth: AngularFireAuth,
  ){}

  ngOnInit(){
    this.initUser();
    this.segment1 = true;
  }
  initUser(){
    this.user = {
      uid: '',
      name: '',
      email: '',
      photo: '',
      password: '',
      emailVerified: false,
    };
  }

  async onRegister(){
    const credentials = {
      email: this.user.email,
      password: this.user.password
    };
    const res = await this.authSvc.register(credentials.email, credentials.password).catch(err => {
    });
    // const isVerified = this.authSvc.isEmailVerified(this.user);
    const id = await this.authSvc.getUid();
    this.user.uid = id;
    this.saveUser();
    console.log(id);
  }

  async saveUser() { // registrar usuario en la base de datos con id de auth
    const path = 'Users';
    const name = this.user.name;
    if (this.newFile !== undefined){
      const res = await this.fireStorageService.uploadImage(this.newFile, path, name);
      this.user.photo = res;
    }
    this.firestoreService.createDoc(this.user, path, this.user.uid).then(res => {
      this.presentToast('Registro exitoso!');
      this.redirectUser(true);
    }).catch (err => {
      console.log(err);
      this.presentToast(err.message);
    });
  }

  async newPhotoProfile(event: any){
    if (event.target.files && event.target.files[0]){
      this.newFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = ((image) => {
        this.user.photo = image.target.result as string;
      });
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  async redirectUser(isVerified: boolean){
    if (isVerified){
      await this.router.navigate(['home']);
    }else{
      // await this.router.navigate(['verify-email']);
      console.log('no');
    }
  }

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 4500,
      color: 'dark'
    });
    toast.present();
  }
  async onRegisterGoogle(){
    const path = 'Users';
    try{
      const res = await this.fireAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      const user = res.user;
      if (user){
       // const isVerified = this.authSvc.isEmailVerified(user);
        this.user.name = user.displayName;
        this.user.photo = user.photoURL;
        this.user.email = user.email;
        this.user.uid = user.uid;
        this.firestoreService.createDoc(this.user, path, user.uid).then( res => {
        this.redirectUser(true);
      }).catch (err => {
        console.log(err);
        this.presentToast(err.message);
      });
      }
    } catch (error){
      console.log(error);
    }
  }
  segmentChanged(event){
    const seg = event.target.value;
    if (seg === 'segment1'){
      this.segment1 = true;
      this.segment2 = false;
    }
    if (seg === 'segment2'){
      this.segment1 = false;
      this.segment2 = true;
    }

  }

}
