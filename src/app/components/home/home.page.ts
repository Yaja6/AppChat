import { Component, OnInit } from '@angular/core';
import { MessageInterface } from 'src/app/models/msg.interface';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { UserInterface } from 'src/app/models/user.interface';
import { ModalController } from '@ionic/angular';
import { ChatPage } from '../modals/chat/chat.page';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {


  user: UserInterface = {
    uid: '',
    name: '',
    email: '',
    photo: '',
    password: '',
    emailVerified: false,
  };

  idCurrentUser: string;
  private path = 'Users/';
  users: UserInterface[] = [];

  constructor(
    private authSvc: AuthService,
    public firestoreService: FirestoreService,
    private router: Router,
    public alertController: AlertController,
    public modalController: ModalController,
  ) {
    this.authSvc.stateAuth().subscribe(res => {
      console.log(res);
      if (res != null){
        this.idCurrentUser = res.uid;
        this.getUserInfo(this.idCurrentUser);
        console.log('id ini', this.idCurrentUser);
      }else{
        this.initUser();
      }
    });
   }

  ngOnInit() {
    this.getUsers();
  }
  initUser(){
    this.idCurrentUser = '';
    this.user = {
      uid: '',
      name: '',
      email: '',
      photo: '',
      password: '',
      emailVerified: false,
    };
  }
  getUsers(){
    this.firestoreService.getCollection<UserInterface>(this.path).subscribe( res => {  // res - respuesta del observador
    this.users = res;
    console.log('Users', res);
   });
  }
  getUserInfo(uid: string){ // trae info de la bd
    const path = 'Users/';
    this.firestoreService.getDoc<UserInterface>(path, uid).subscribe( res => {
      this.user = res;
    });
  }
  async modalMessage(id: string) {
    const modal = await this.modalController.create({
      component: ChatPage,
      componentProps: {
        idUser: id
      }
    });
    return await modal.present();
  }
  logout() {
    this.authSvc.logout();
    console.log('saliendo');
    this.router.navigate(['login']);
  }
}
