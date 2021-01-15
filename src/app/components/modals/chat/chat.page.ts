import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController, ToastController } from '@ionic/angular';
import { MessageInterface } from 'src/app/models/msg.interface';
import { UserInterface } from 'src/app/models/user.interface';
import { AuthService } from 'src/app/services/auth.service';
import { FirestorageService } from 'src/app/services/firestorage.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import * as CryptoJS from 'crypto-js';
@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {

  newFile: '';
  uName = '';
  uPhoto = '';
  idCurrentUser = '';
  textToEncrypt: string;
  passEncrypt = 'pruebachat';
  mostrar = false;
  private path = 'Messages/';

  msg: MessageInterface = {
    id: '',
    idUserTo: '',
    idUserFrom: '',
    text: '',
    img: '',
    uName: '',
    uPhoto: '',
    date: new Date(),
    hour: '',
    textDes: ''
  };
  userFrom: UserInterface = {
    uid: '',
    name: '',
    email: '',
    photo: '',
    password: '',
    emailVerified: false,
  };
  userTo: UserInterface = {
    uid: '',
    name: '',
    email: '',
    photo: '',
    password: '',
    emailVerified: false,
  };
  messages: MessageInterface[] = [];
  mess: MessageInterface[] = [];
  @Input() idUser: any;
  constructor(
    public modalCtrl: ModalController,
    public firestoreService: FirestoreService,
    public authSvc: AuthService,
    public fireStorageService: FirestorageService,
    public toastController: ToastController,
    public loadingController: LoadingController,
  ) {
    this.authSvc.stateAuth().subscribe(res => {
      console.log(res);
      if (res != null){
        this.idCurrentUser = res.uid;
        this.getCurrentUserInfo(this.idCurrentUser);
        console.log(this.idCurrentUser);
      }else{
        console.log('user not found');
      }
    });
  }

  ngOnInit() {
    this.getmsgs();
    this.getUserInfo();
    this.formatAMPM();
  }
  dismiss() {
    this.modalCtrl.dismiss();

  }
  async saveMessage(){
    const path = 'Messages/';
    const name = this.msg.id;
    this.msg.id = this.firestoreService.getId();
    this.msg.uName = this.uName;
    this.msg.uPhoto = this.uPhoto;
    this.msg.idUserTo = this.idUser;
    this.msg.idUserFrom = this.idCurrentUser;
    this.msg.text = CryptoJS.AES.encrypt(this.textToEncrypt.trim(), this.passEncrypt.trim()).toString();
    this.msg.textDes = CryptoJS.AES.decrypt(this.msg.text.trim(), this.passEncrypt.trim()).toString(CryptoJS.enc.Utf8);
    if (this.newFile !== undefined){
      this.presentLoading();
      const res = await this.fireStorageService.uploadImage(this.newFile, path, name);
      this.msg.img = res;
    }
    this.firestoreService.createDoc(this.msg, path, this.msg.id).then(res => {
      this.textToEncrypt = '';
      this.msg.img = '';
      this.mostrar = false;
      console.log('Mensaje enviado!');
    }).catch (err => {
      console.log(err);
    });
  }

  getCurrentUserInfo(uid: string){ // trae info de la bd
    const path = 'Users/';
    this.firestoreService.getDoc<UserInterface>(path, uid).subscribe( res => {
      this.userFrom = res;
      this.uName = this.userFrom.name;
      this.uPhoto = this.userFrom.photo;
    });
  }
  getUserInfo(){ // trae info de la bd
    const path = 'Users';
    this.firestoreService.getDoc<UserInterface>(path, this.idUser).subscribe( res => {
      this.userTo = res;
    });
  }

  getmsgs(){
    const as = this.firestoreService.getCollection<MessageInterface>(this.path).subscribe( res => {  // res - respuesta del observador
    this.messages = res;
    });
  }

  formatAMPM() {
    const  hours = this.msg.date.getHours();
    const minutes = this.msg.date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const strTime = hours + ':' + minutes + ' ' + ampm;
    this.msg.hour = strTime;
  }
  newMessageImage(event: any){
    if (event.target.files && event.target.files[0]){
      this.newFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = ((image) => {
        this.msg.img = image.target.result as string;
      });
      reader.readAsDataURL(event.target.files[0]);

    }
  }
  async presentLoading() {
    const loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Enviando...',
      duration: 10000
    });
    await loading.present();

    const { role, data} = await loading.onDidDismiss();
    console.log('Loading dismissed!');
  }
}
 