export interface MessageInterface{
    id: string;
    idUserTo: string;
    idUserFrom: string;
    text: string;
    img?: string;
    textDes: string;
    uPhoto?: string;
    uName?: string;
    date?: Date;
    hour?: string;
}
