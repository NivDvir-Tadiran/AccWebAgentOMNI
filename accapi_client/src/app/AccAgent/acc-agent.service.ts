import { OnDestroy, OnInit, Injectable } from '@angular/core';
import {
    UserStatusModel, LoginUser, Agent, AccCallState, oneTab, CP_CODES,
    OneCall, AccAgentConf, AgentStatus, AccNotifications, AgentCallStateTxt,
    Key_Desc, AgentStatusTxt, CP_EXT, CP_EXT_FIELDS,
    eDenyCauseStr, CallTypes, OneQueuedCall, COS, CPini, CALL_TYPE,PSWTotals,QUEUED_ACD_GROUP} from './data-model.interface';
//import { Sse } from './Sse';
import { AppConfig } from '../config/app.config';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '../core/shared/logger.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CoreApiService } from './genericRequest';
import {BehaviorSubject, Observable, of, OperatorFunction, timer} from 'rxjs';
import {NavigationExtras, Router} from '@angular/router';
import { AccButtons, AccOneButton2, accbutton, accButtonInIni, TelActionIni } from 'src/app/AccAgent/tel-win-btn/AccBtnsDef';
import {Md5} from 'ts-md5/dist/md5';
import { Salesforce } from 'src/app/salesforce/salesforce';
import {AuthService} from "../_helpers/auth.service";
import {TokenStorageService} from "../_helpers/token-storage.service";
import {IAppConfig} from "../config/iapp.config";
import {SseComponent} from "./sse/sse.component";
const httpOptions = {
    headers: new HttpHeaders({ "Content-Type": "application/json" })
};


const EmptyRsponse: OneCall = new OneCall("-1");
@Injectable({
    providedIn: 'root'
})
export class AccAgentService implements OnInit, OnDestroy {
    public accNotificationsO: Observable<any>;
    // accNotifications: Observable<AccNotifications>;
    public waitForLogin:boolean = false;
    public waitForLoginTime: Date = null;
    public m_CpIni: CPini = null;
    public CPFDelimeter: string = "%";
    public CPF_DOES_NOT_EXIST: string = "CPF_DOES_NOT_EXIST";
    public CPF_NOT_FOUND_IN_CALL: string = "CPF_NOT_FOUND_IN_CALL";
    public accNotifications: AccNotifications;
    public sessionId = null;
    public isAeonixAppCenterOn:boolean = false;
    public agaenLogin: LoginUser = new LoginUser("", "", "");
    public agent: Agent = null;
    public appConfig: any;
    public ACC: AccAgentConf;
    public callsArray: OneCall[] = [];
    public callsLog: OneCall[] = [];
    public QueuedCalls: OneQueuedCall[] = [];
    public http_responses: string[] = []; // 2020-08-10 AlisherM BZ#52754: array that will store HTTP responses (up to 10)
    public userStatus: UserStatusModel;
    public PhoneNo: String;
    public isMainPageReady: boolean = false;
    public etasIni: any;
    public CRM: any = null; // 2019-09-24 AlisherM BZ#50840: json object with CRM configuration
    public phonebook:any =  {data: [{name:" ", category:"! ",phone1:" ",phone2: " ",private: " "}]};
    public agentcallinfo: any;
    public agentButtons: accButtonInIni[] = [];
    public telActionINIList: TelActionIni[] = [];
    public m_isLogonSaved: boolean = false;
    public m_StartStatusDateSaved: number = null;
    public htmlDir = "ltr";
    //
    public SetReleaseCodesButton: boolean = false;
    public SetTransferToAgentButton: boolean = false;
    //
    public SetOneGroupsListButton: boolean = false;
    public curentCall: string = "";
    public callsCount: string = "";
    public step_no_ring: string = "fa fa-step-forward footer_img";
    public step_ring: string = "fa fa-step-forward footer_img_ring";
    public fa_step_forward: string = "fa fa-step-forward footer_img";
    public callIconMedia: string = "assets/images/CallTypeIcons/no_icon.ico";// "fa fa-pause";
    public callIconType: string = "assets/images/CallTypeIcons/no_icon.ico";
    public callIconRecord: string = "assets/images/CallTypeIcons/RecordUnactive.svg";

    public agent_note: string = "";
    public acdMainStatus: string = "Ready";
    //
    private accLoginP: string;
    private accLoginPJWT: string;
    private SSORequestP: string;
    private accrequestP: string;
    private accNotificationP: string;
    private accSseP: string;
    private accSseSubscribeP: string;
    private translations: any;
    public accForm: any = null;
    // public snackBar: MatSnackBar;
    public localurl = ' http://172.28.1.53:8088';
    public appName:string = "";

    public AccWebServersURLS: string[] = [];
    public AccWebcurURLidx: number = -1;
    public agtName = "";
    public agtPwd = "";
    public ext = "";
    public autuAgt = "0";
    public ringNsecodes: number = 0;
    private httprequests: CoreApiService;
    private mytimer: any;
    public NotificationInterval = 5000; // start with 10000
    public subscription: any = null;
    public CurrStatus: string = '';
    //public sse: Sse;
    public btns: any;
    public savedNumbers: any;
    public NoConnectionToAcc: boolean = false;
    // callback handler
    public ConfirmCallBack: boolean = false;
    public CallBackTimerStr:string ="0"; 
    public CallBackTimer =   100;
    public PrevSecond:number = 120;
    public CallbackCallId:number = -1;
    public isSupervisorHelp:boolean = false;
    public agentsReadyList:any[] = [{}];
    public windowObjectReference: any;
    public sse: SseComponent;




    public CheckOnSecondBoubdry()
    {
        if (this.ConfirmCallBack == false){return;}
        let  bttt   = Math.floor(Date.now()/ 1000);
        if (bttt != this.PrevSecond)
        {
            this.PrevSecond = bttt;
            this.CallBackTimer--;
            if (this.CallBackTimer > 0)
            {
                this.CallBackTimerStr = this.CallBackTimer.toString();
            }
            else {
                this.CallBackConfiemed(0);
            }
        }
    }
         // ============================[CallBackConfiemed]=================================
         CallBackConfiemed(truefalse:number) {
            let truefalse_str:string = truefalse.toString()
            this.ConfirmCallBack = false;
            var action = 'ConfirmOutboundCallResult';
            this.PrepareAndPutNotification(action, action + ",000," +
                this.agent.m_AgentNo + "," + this.CallbackCallId + "," + truefalse_str + ",,,");
            this.CallbackCallId = -1;
            this.CallBackTimer = -1;

          }
    
   // ---------

    // tslint:disable-next-line: member-ordering
    public NoConnectionReason = 0;

    // tslint:disable-next-line: member-ordering
    public OCP: Key_Desc[] = [];
    public OCPQ: Key_Desc[] = [];
    public curOCP: Key_Desc[] = [];
    public currentLang: string;
    public answerIdx = 0;
    public busyIdx = 1;
    public ACC_VERSION: string = '8.0.107';
    //public ACC_VERSION: string = '%ACC_VERSION%';
    public ACCVERSION = "";
 
    //
   public crmmode = "";
    //
    LastPersonal:string = "";
    LastGrpPersonal:string = "";
    PSWtot:PSWTotals = new PSWTotals();
    
    LastPersonalDate:any = ""; 
    LastPersonalGrpDate:any = ""; 
    PSWQtot:QUEUED_ACD_GROUP = new QUEUED_ACD_GROUP();
    //

    public salesforce: Salesforce = null;
    public isSalesforce: boolean = false;
    public savedURL:URL = null;
    public savedURLSearch:string = null;
 
    // ======================= [constructor] ==============================
    constructor(private router: Router, public coreApiService: CoreApiService,
                private http: HttpClient, private trnslt: TranslateService, public snackBar: MatSnackBar,
                public  authService: AuthService, private tokenService: TokenStorageService) {
        //private sse1: Sse) {
        this.currentLang = this.trnslt.currentLang;
        this.CallStatus_ElapsedTime = -1;
        this.callsArray = [];
        this.userStatus = new UserStatusModel();
        // parse ful url to ip,port, params
        var parsedUrl = new URL(window.location.href);
        var url = parsedUrl.hostname;
        var port = parsedUrl.port;
        var protocol = parsedUrl.protocol;
          this.localurl = protocol + "//" + url + ":" + port;
        var ipx = window.location.href.split('/');
        var ver = this.ACC_VERSION.split('.');
        this.ACCVERSION = this.ACC_VERSION;// ver.join('_');
        this.appName = '/accOMNI';
        this.log("0: " + ipx[0] + " ;1: " + ipx[1] + " ;2: " + ipx[2] + " ;3: " + ipx[3]);
        this.log("document.URL: " + document.URL);
  
          let params = parsedUrl.searchParams;
        var p = params.get("params");
        if (p != undefined)
        {
             this.saveCredintial(p);
             parsedUrl = null;
             parsedUrl = new URL(this.localurl + this.appName + this.savedURLSearch);
             params = parsedUrl.searchParams;
             //console.log("params: " + p);
         }
          //----------------------------------------------------------
        this.savedURLSearch = localStorage.getItem("SavedUrlSearch");
        if ((this.savedURLSearch && this.savedURLSearch.indexOf('agentno') != -1)){
            this.savedURLSearch = '';
            localStorage.removeItem("SavedUrlSearch");
        }
        else{
         if (this.savedURLSearch == null || this.savedURLSearch == ""){
            this. savedURLSearch = '';
            this.savedURLSearch = parsedUrl.search;
            localStorage.setItem("SavedUrlSearch",this.savedURLSearch);
        }
        else {
            parsedUrl = null;
            parsedUrl = new URL(this.localurl + this.appName + this.savedURLSearch);
         }
        }
        this.savedURL = parsedUrl;
        params = parsedUrl.searchParams;
        console.log('**** savedURLSearch: ' + parsedUrl.search);
         //----------------------------------------------------------
         this.savedURL = parsedUrl;
        this.crmmode = params.get("crmmode");
        this.sessionId = "";
        if (this.crmmode == null) {this.crmmode = "";}
            if (this.crmmode != "" && this.crmmode == "salesforce") {
            this.isSalesforce = true;
             //https://172.28.1.177:8445/accOMNI/?crmmode=salesforce&mode=Lightning&isdtp=vw&sfdcIframeOrigin=https:%2F%2Fna85.lightning.force.com&nonce=e095448ebf3f4299846cddc1cdf2f1e5499fd59ac4c2ee38c4f6f8ac677ddc8e&ltn_app_id=06m1U000001Vtu7QAC&clc=0
            var salesforce_instance_url = params.get("sfdcIframeOrigin");
            this.salesforce = Salesforce.getInstance(this, salesforce_instance_url);
        }
        var an = params.get("agentno");
        if (an == null) {
            var b = this.LoadCredintial();
            if (b == false) {
                this.log("agentno params = null=> no params");
                this.agaenLogin = new LoginUser("", "", "");
            }
        }
        else {
            this.log("agentno param: " + an);
            var sessionid = params.get("sessionId");
             if (sessionid != undefined){
                 this.sessionId = sessionid;
            } else{
                this.SetSessionId();
            }
            let pwd = params.get("pwd");
            let pwdx:any = "";
            if (pwd != null && pwd.length < 15){
                pwdx = Md5.hashStr(this.sessionId + ':' + pwd);
             }
             else {
                 pwdx = pwd;
             }
             this.agaenLogin = new LoginUser(an, pwdx, parsedUrl.searchParams.get("ext"));
            this.agaenLogin.auto = Number(params.get("auto"));
            this.agaenLogin.ringsecs = Number(parsedUrl.searchParams.get("ringsecs"));
        }
        this.log("url: " + url);
        if (port == "6969") {
            port = AppConfig.endpoints.accWSPort; // in case in development
            this.accLoginP = AppConfig.endpoints.accBaseP + AppConfig.endpoints.accLoginP;
            this.accLoginPJWT = AppConfig.endpoints.accBaseP + AppConfig.endpoints.accLoginPJWT;
            this.accrequestP = AppConfig.endpoints.accBaseP + AppConfig.endpoints.accRequestP;
            this.accNotificationP = AppConfig.endpoints.accBaseP + AppConfig.endpoints.accNotificationP;
            this.SSORequestP = AppConfig.endpoints.SSORequestP;
        }
        else {

            this.accLoginP = this.appName + AppConfig.endpoints.accLoginP;
            this.accLoginPJWT = this.appName + AppConfig.endpoints.accLoginPJWT;
            this.accrequestP = this.appName + AppConfig.endpoints.accRequestP;
            this.accNotificationP =  this.appName + AppConfig.endpoints.accNotificationP;
            this.SSORequestP = this.appName + AppConfig.endpoints.SSORequestP;

        }
        this.log("localurl: " + this.localurl + ", notification url: " + this.accNotificationP);
        // this.accSseSubscribeP = AppConfig.endpoints.accSseSubscribeP;
        // this.accSseP = AppConfig.endpoints.accSse;
        //
        //
        //var md555 = Md5.hashStr(url); 
 
        this.httprequests = coreApiService;
        // this.agent = new Agent("");
        this.ACC = new AccAgentConf("\0");
        this.trnslt.get(['heroCreated', 'saved', 'heroLikeMaximum', 'heroRemoved'], {
            'value': AppConfig.votesLimit
        }).subscribe((texts) => {
            this.translations = texts;
        });

        this.mytimer = timer(0, this.NotificationInterval); // Call after 10 second.. Please set your time
        //this.sse = sse1;
        var ip = window.location.origin;
        this.callStatDataSource = [];
    }

    //
 
    // =======================[onResize]====================
    windowheight = 0;
    windowwidth = 0;
    screenWidth: number = 250;
    onResize(event) {

        if (this.isGrids == false && this.screenWidth < event.target.innerWidth) {
            //          window.resizeTo(this.screenWidth,window.innerHeight);
        }
        //this.imgcols = (event.target.innerWidth < 240) ? 2 : 3;
    }
    // ==================[ngOnInit]===================================
    ngOnInit() {
        var ip = window.location.origin;
        var a = Date.now();
        this.LastDidpslayedStatus = AgentStatus.DontCare;
        this.callIconMedia = 'assets/images/CallTypeIcons/no_icon.ico';
        this.callIconType = 'assets/images/CallTypeIcons/no_icon.ico';
        this.callIconRecord = 'assets/images/CallTypeIcons/RecordUnactive.svg';
    }
    // ==============[ngOnDestroy]==============================================
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
    // ==============[setaccForm]==============================================
    public setaccForm(accForm: any) {
        this.accForm = accForm;
    }
       // ==============================[force log to server] ================================
       ForceLogToServer(msg: string) {
           if (this.agent == null) return this.log(msg);
           try{
           var date: Date = new Date();
           date.getDate();
           var ddd = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
           var b64 = this.b64EncodeUnicode(msg);

           this.log(msg);
           this.PrepareAndPutNotification("__agentLog", "__agentLog" + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + ddd + "," + b64);
           //2020-08-03 AlisherM: send same message to console also
           console.log(msg);
        } catch (e) { }
       
       }

    // ==============================[Log] ================================
    log(msg: string) {
        try {
            var date: Date = new Date();
            date.getDate();
            var ddd = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();

            if (1 == 1 || this.etasIni == undefined || this.agent == undefined || this.etasIni.IsLogWebAgent == false) {
                 console.log(ddd + ","+ msg);
                return;
            }
             var b64 = this.b64EncodeUnicode(msg);
            this.PrepareAndPutNotification("__agentLog", "__agentLog" + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + ddd + "," + b64);
         } catch (e) { }
    }
    // ====================================================
    public ShowPSTGROUPS:boolean = false;
    public ShowPSTQGROUPS:boolean = false;
    public ShowPST:boolean = false;
    public ShowNumpad: boolean = false;
    public ShowGroupsList: boolean = false;
    public ShowOneGroupsList: boolean = false;
    public ShowReleaseCodes: boolean = false;
    public ShowTransferToAgentList: boolean = false;
    public cpDialog: boolean = false;
    public cpInsert: boolean = false;
    public cpDialogQ: boolean = false;
    public cpDialogL: boolean = false;
    public propDialog: boolean = false;
    public telNewBtnDialog: boolean = false;
    public ShowWrapupCodes: boolean = false;
    public ShowButtonList: boolean = false;
    public SetWrapupCodesButton: boolean = false;
    public SetTransferToAgent: boolean = false;
    // ==========================[offAllSpecialForms]========
    offAllSpecialForms() {
        this.ShowNumpad = false;
        this.ShowReleaseCodes = false;
        this.ShowGroupsList = false;
        this.ShowOneGroupsList = false;
        this.ShowWrapupCodes = false;
        this.ShowButtonList = false;
        this.telNewBtnDialog = false;
        this.cpDialog = false;
        this.cpDialogQ = false;
        this.cpDialogL = false;
        this.SetTransferToAgent = false;
    } 
   // ==========================[offllPartialSpecialForms]========
   offAllPartialSpecialForms() {
    this.ShowNumpad = false;
    this.ShowReleaseCodes = false;
    this.ShowGroupsList = false;
    this.ShowOneGroupsList = false;
    this.ShowWrapupCodes = false;
   }

    //
    public tiles: Array<accbutton> = null;
    // ==========================[setTiles]========

    setTiles(tiles: any) {
        if (tiles != null) {
            this.tiles = tiles;
            if (tiles.length < 2) { return; }
            this.setEmtyButton();
            this.displayOnOffreleaseImage();
            this.OCP = [];
            this.OCPQ = [];
            for (var g = 0; g < this.ACC.m_CallProfileLists.length; ++g) {
                this.OCP.push(this.ACC.m_CallProfileLists[g]);
                this.OCPQ.push(this.ACC.m_CallProfileLists[g]);
            }
            this.OCP.sort((a, b) => (a.Desc > b.Desc) ? 1 : ((b.Desc > a.Desc) ? -1 : 0));
            this.OCPQ.sort((a, b) => (a.Desc > b.Desc) ? 1 : ((b.Desc > a.Desc) ? -1 : 0));

            for (var j = 0; j < CP_EXT_FIELDS.length; ++j) {
                this.OCP.push(new Key_Desc(CP_EXT_FIELDS[j].col_idx.toString(), CP_EXT_FIELDS[j].col_desc, ""));
                //this.OCPQ.push(new Key_Desc(CP_EXT_FIELDS[j].col_idx.toString(), CP_EXT_FIELDS[j].col_desc, ""));
            }
            this.curOCP = this.OCP;
            //
            this.offAllSpecialForms();
            this.buildWinTab();
        }
        var relstr: string = this.userStatus.userReleased == true ? 'false' : 'true';
        var action = "login";
        if (this.agaenLogin.auto == 1) {
            this.log("auto login");
            this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + ", ," + this.agent.m_Extension + "," + relstr);
        }
        else {
            if (this.m_isLogonSaved == true) {
                this.log("setTiles=> .m_isLogonSaved == true (from disconect webserver or acc = do logout/login");
                this.m_isLogonSaved = false;
 //               action = "logout";
 //               this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + ", ," + this.agent.m_Extension + "," + relstr);
                action = "login";
                this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + ", ," + this.agent.m_Extension + "," + relstr);
            }
            else {
                if (this.agent.m_isLogon == true) {
                    this.setAccButton("loginPrimaryId", 1, true);
                }
                else {
                    this.setAccButton("loginPrimaryId", 0, true);
                }
            }
            this.userStatus.userReleased = false;
        }
    }
    // ======================= [setAccAgentPage] ==========================
    public accagentPage: any = null;
    public overlayRef: any = null;
    public setAccAgentPage(accagentpage) {
        this.accagentPage = accagentpage;
    }
    public setSSEConector(sse) {
        this.sse = sse;
    }
    public setOverlayRef(overlayRef) {
        this.overlayRef = overlayRef;
    }
    // ======================= [handleDialpadCall] ==================================
    public callType: CallTypes = CallTypes.MAKECALL;
    public callTypetxt: string = "";
    public imgcall: accbutton = null;
    public imgrelease: accbutton = null;
    public imgTtA: accbutton = null;
    public imgonegroup: accbutton = null;
    public imgWU: accbutton = null;
    // called from mumpad submit
    //2019-05-22 AlisherM BZ#49794: renamed this function from makeCAll to handleDialpadCall and added simple makeCall function which will be called from salesforce
    handleDialpadCall(phone: string) {
        if (phone == undefined || phone == "") { this.log("handleDialpadCall=> no phone number") }
        switch (this.callType) {
            case CallTypes.MAKECALL:
                this.makeCall(phone);
                break;
            //
            case CallTypes.TRANSFER:
                this.transferCall(phone);
                break;
            //
            case CallTypes.CONSULTATION:
                this.consultationCall(phone);
                break;
            //
            case CallTypes.SILENT_MONITOR:
                this.SilentMonitorCall(phone);
                break;
            //
            case CallTypes.BREAKIN:
                this.BreakinCall(phone);
                break;
            //
            case CallTypes.WHISPER:
                this.WhisperCall(phone);
                break;
            //
            default: break;
        }
        this.telNewBtnDialog = false;
        this.ShowNumpad = false;
    }
   // ======================= [SetCallType] ==================================
   SetCallType(actionCode:string){
       switch (actionCode){
        case 'MakeNACall': this.callType = CallTypes.MAKECALL; break;
        case 'Alternate': this.callType = CallTypes.TRANSFER; break;
        case 'StartConsultation': this.callType = CallTypes.CONSULTATION; break;
        case 'SilentMonitor': this.callType = CallTypes.SILENT_MONITOR; break;
        case 'BrakeIn': this.callType = CallTypes.BREAKIN; break;
        case 'Whisper': this.callType = CallTypes.WHISPER; break;
        default: break;
    }
   }

    // ======================= [makeCAll] ==================================
    makeCall(phone: string, OutboundPrefix?:string) {
        var action = 'makecall';
        var oprefix = OutboundPrefix != undefined? OutboundPrefix : "";
        //2019-08-18 AlisherM: I commented following code because agent shouldn't have permission to set its Outbound_caller_id, this should be done by administrator
        //if (lob == "" && this.etasIni.Outbound_caller_id != "")
        //{
        //    lob = "__" + this.etasIni.Outbound_caller_id;
        //}
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + phone + "," + oprefix);
    }

    // ======================= [transferCall] ==================================
    transferCall(phone: string) {
        var action = 'singlesteptransfer';
        var row: OneCall = this.getCurrentRowCallId();
        if (row == null) {
            this.log("pickup/transfer  Error: request - no call to pickup/transfer found");
            return;
        }
        if (row.m_CallState == AccCallState.Ringing) {
            this.DivertCall(row, phone);
        }
        else {
            //this.updateStartConsultation(this.agent.m_CallIndex);
            this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + row.m_CallId + "," + this.agent.m_Extension + "," + phone);
        }
    }
    //======================[PickupCall] ====================================
    PickupCall(row: any, action: string) {
        var callid = row.AA_CID;
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + callid);
    }
    //======================[breakCall] ====================================
    BreakinCall(agtNo: string) {
        var action = 'bargin';
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + agtNo);
    }
    //======================[SilentMonitorCall] ============================
    SilentMonitorCall(agtNo: string) {
        var action = 'silentmonitor';
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + agtNo);
    }
    //======================[WhisperCall] ==================================
    WhisperCall(agtNo: string) {
        var action = 'whisper';
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + agtNo);
    }
    //======================[RecordGreeting] ==================================
    RecordGreeting(agtNo: string) {
        var action = 'recordgreeting';
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + agtNo);
    }
    //======================[DivertCall] ====================================
    DivertCall(row: OneCall, phone: string) {
        this.PrepareAndPutNotification("divertcall", "divertcall" + ",000," + this.agent.m_AgentNo + "," + row.m_CallId + "," + this.agent.m_Extension + "," + phone);
    }
    // ======================= [consultationCall] ===============================
    consultationCall(phone: string) {
        var action = 'starttransfer';
        var callid = this.getCurrentCallId();
        if (callid == "") {
            this.log("start consultation Error: request - no call to transfer found");
            return;
        }
        this.updateStartConsultation(this.agent.m_CallIndex,phone);
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + callid + "," + this.agent.m_Extension + "," + phone);
    }
    //=======================[setCAllButton]===============================
    public LastBottomClick: number = -1;
    setCAllButton(phoneNo: string) {
        if (phoneNo == "") {
            this.ShowAlert("Empty phone no");
            return;
        }
        if (this.telNumber == false) {
            this.imgcall.title = this.imgcall.titlesrc + "\n" + phoneNo;
            this.imgcall.data = phoneNo;
            this.imgcall.isSet = true;
            this.imgcall.class = this.imgcall.setClass;
            //this.tiles[this.LastBottomClick] = this.imgcall;
            //this.tiles.splice(this.tiles.length - 1, 0, this.imgcall);
            var b: accButtonInIni = new accButtonInIni(this.imgcall.code, phoneNo);
            var a = this.agentButtons.find(x => x.Button === this.imgcall.code);
            this.agentButtons.splice(this.agentButtons.length - 1, 0, b);
            this.ShowNumpad = false;
        }
        else // from telephony windwo
        {
            this.TelCurrAction.data = phoneNo;
        }
    }
    //=======================[timerSubscribe]===============================
    donthing = false;
    isfinishedBeforenextTimeInterval: boolean = true;
    timerSubscribe() {
        this.timerUnSubscribe();
        this.mytimer = timer(0, this.NotificationInterval);
        if (this.subscription == null) {
            var TT: any = this;
            this.subscription = this.mytimer.subscribe(x => {
                //
                if (TT.isfinishedBeforenextTimeInterval != true) { this.log("X1") }
                else {
                    TT.isfinishedBeforenextTimeInterval = false;
                    if (this.sse?.isSubscribed != true) { TT.Send_KeepAliveToAcc()} //send keapalive to accapi
                     TT.Send_getGroupQueueCPInfoToAcc(); // check if to get ACD queue detalis
                    //

                    if (this.sse?.isSubscribed != true) { TT.GetAccNotification(); }
                    TT.CheckCloseWindow();

                }
                TT.isfinishedBeforenextTimeInterval = true;
            });
        }
    }
    //=========================[timerUnSubscribe]=============================
    timerUnSubscribe() {
        if (this.subscription != null) {
            this.subscription = this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
    // =============== [CheckCloseWindow] ===============
    CheckCloseWindow() {
        if (this.messageTimer != null) {
            var t: Date = new Date();
            if (t.getTime() >= this.messageTimer.getTime()) {
                this.setupDocRef.close();
                this.setupDocRef = null;
                this.messageTimer = null;
            }
        }
        if (this.waitForLogin == true) {
            var t: Date = new Date();
            if (t.getTime() >= this.waitForLoginTime.getTime()) {
                this.ForceLogToServer(" Logon operatione FAILED ");
                this.waitForLoginTime = null;
                this.waitForLogin = false;
             }
        }        
    }
    // ============================== [Message] ===========
    messageTimer: Date = null;
    message(msg: string) {
        //this.agent_note = msg;
        //this.messageTimer = 7;
        this.ShowAlert(msg);
    }
    // ============================== [ShowAlert] ==========
    public setupDocRef: any = null;
    alertPage:string = '<html>' +
        '<head> <link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet">' +
        '<style> a.b { font-family: "Roboto", sans-serif;} </style> </head>' + 
        '<body> <a class="b">Replace me Too</a> </body> </html>'

    ShowAlert(text: string,params?:string) {
        if (this.setupDocRef != null) {
            this.setupDocRef.close();
            this.setupDocRef = null;
            this.messageTimer = null;
        }
        var higthx: number = window.screen.availHeight;
        var topx: number = window.screenY + window.screen.availHeight - 300;
        this.log("top=" + topx);
        var s = text;
        var s1;
        this.trnslt.get(s).subscribe((textX: string) => { s1 = textX });
        try{
         if (params != undefined && params != "")
        {
            var ss = params.split(";");
            for (let i = 0; i < ss.length; ++i)
            {
                 var sss = ss[i].split(":");
                console.log(ss[0] + " : " + ss[1]);
                var search  = "%" + sss[0] + "%";
                var s2  = s1.replace(search,sss[1]);
                s1 = s2;
             }
             console.log("s1: " + s1);
        }
        } catch(e) {}
        var w = (s1.length * 10) + 20;
        w = this.windowwidth - 20;
        this.setupDocRef = null;
        for (let x =0;x < 10; ++x)
        {
            this.setupDocRef = window.open("", "", "resizable=0,toolbar=0,menubar=0,location=0,width=" + "" +  ",height=100,left=" + (window.screenLeft + 20) + ", top=" + topx);
            if (this.setupDocRef != null) {break;}
        }
        this.log("ShowAlert: " + s + " / " +  s1);
        if (this.setupDocRef == null) {this.log("ShowAlert: cannot open new window"); return;}
        var ssss = this.replaceall(this.alertPage,'Replace me Too',s1);
        this.setupDocRef.document.write(ssss);
        var d:Date =  new Date();
        d.getDate();
        var t:string = this.pad(d.getHours(),2)
        this.setupDocRef.document.title =this.pad(d.getHours(),2) + ":" + this.pad(d.getMinutes(),2)  + ":" + this.pad(d.getSeconds(),2) + " - Acc alert";
        this.setupDocRef.focus();
        this.messageTimer = null;
        //this.messageTimer = new Date();
        //this.messageTimer.setTime(this.messageTimer.getTime() + (3600 * 1000));
    }
    // ============================== [ ShowPersonal] ==========
    public personalRef: any = null;
    ShowPersonal(params:string) 
    {
        var topx: number = window.screenY + window.screen.availHeight - 300;
        var d:Date =  new Date();
        d.getDate();
        var t:string = this.pad(d.getHours(),2);
        //this.setupDocRef.document.title =this.pad(d.getHours(),2) + ":" + this.pad(d.getMinutes(),2)  + ":" + this.pad(d.getSeconds(),2) + " - Acc alert";
        //this.setupDocRef.document.write("aaaa");

    }

    //-------------[ GetSessionId ] --------------------------
    GetSessionId()
    {
        return this.sessionId ?? this.SetSessionId();
    }
    //-------------[ SetSessionId ] --------------------------
    SetSessionId()
    {
        var id: string = "";

        if (this.tokenService.getSessionId() != null) {
            id = this.tokenService.getSessionId();
        } else {
            var a: string = Date.now().toString();
            var parts: string[] = a.split("").reverse();
            var l: number = parts.length -1;
            for (var i = 0; i < parts.length-4; ++i) {
                id += parts[Math.floor(Math.random() * (l + 1))];
            }
        }
        this.sessionId =   id;

       return id;
     }
   //-------------------------------
     aaa: Observable<any> = null;
    countEmptyNotification: number = 0;
    isSSO: boolean = false;
    isSSOSeating = true;
    SSOuser: string = "";
    // ================== [Get SSO status] ================================
    getAACStatus() {
        console.log("++++ getAACStatus");
        var isNavigate: boolean = false;
        if (this.sessionId == "") {
            this.SetSessionId();
        }
        var fullurl = this.localurl + this.SSORequestP + '?agentNo=' + "XX99999999XX" + '&sessionId=' + this.sessionId + "&agentversion=" + this.ACCVERSION;
        var TT: any = this;
        var aaa: Observable<any> = this.httprequests.get<AccNotifications>(fullurl);
        aaa.subscribe(notification => {
            if (notification == undefined) {
                TT.NoConnectionToAcc = true;
                TT.NoConnectionReason = 2; // Tomacat
                this.log("getAACStatus NO Connection");
            }
            else {
                this.log("getAACStatus params" + notification.params);
                var response = notification.params.split(',');
                if (response[10] == "13") // no version
                {
                    this.ShowAlert(eDenyCauseStr[response[10]]);
                     return;
                }
                if (response[3] == 'true') {
                    TT.isSSO = true;
                    var an: String = notification.agentNo;
                    if (an.length == 0) {
                        
                        TT.router.navigate(['/NotSSOUser']);
                        TT.router.navigateByUrl('/NotSSOUser' + this.savedURLSearch);

                    }
                    else {
                        if (response[4] == 'false') {
                            TT.isSSOSeating = false;
                        }
                        TT.SSOuser = notification.agentNo;
                        this.log("SSOuser: " + TT.SSOuser + "; seating: " + TT.isSSOSeating);
                    }
                }
                if (response[5] != '' && response[5] != '%WEB_SERVERS_URLS%') // web server list seperated by ';'
                {
                    this.log("ACC web servers url's: " + response[5]);
                    this.AccWebServersURLS = response[5].split(';');
                    for (let i = 0; i < this.AccWebServersURLS.length; ++i) {
                        this.log("tomact url: " + this.AccWebServersURLS[i]);
                        if (this.localurl == this.AccWebServersURLS[i]) {
                            this.AccWebcurURLidx = i;
                            this.log("found tomacer url from web.xml: " + this.AccWebServersURLS[i]);
                            break;
                        }
                    }
                }
                if (response[6] != "") // Acc Version
                {
                    var a:string = localStorage.getItem("AccVersionRetries");
                    if (a == undefined) {a = '0'};
                    var n = Number(a);
                    if (response[6].trim() != this.ACC_VERSION)
                    {
                        n++;
                        localStorage.setItem("AccVersionRetries", n.toString());
                        if (n > 3)
                        {
                            this.ShowAlert(a + ' Cannot load new ACC version: '  + response[6] + "old: "+  this.ACC_VERSION + " Close ACC agent");
                         }
                        else
                        {
                            this.ShowAlert(a + ' Aeonix Contact Center Agent old version ' + this.ACC_VERSION + ' new version: ' + response[6]);
                            location.reload();
                        }
                    }
                    else
                    {
                        localStorage.setItem("AccVersionRetries", '0');
                    }
                }
            }
        },
        error => {
                   this.log('getAACStatus  Error' + error);
        });
    }
    tomactNotConnectedDate:any = 0;


    public GetAccNotificationsBySSE(notification: AccNotifications[])// string agentNo,int checkInterval,int checkCount, AgentStatus CheckedAgentStatus, AgentStatus CheckedCallStatus, out Agent A,out string err)
    {
        this.HandleNotifications(notification);

        this.SetAgentStatus();
        this.CheckOnSecondBoubdry();
        if (this.isOpenCalls == true && this.CallStatus_ElapsedTime >= 0) {
            this.UpdateElapsedTime();
        }
    }

    // ===================[GetAccNotification]=============================
    GetAccNotification() {
        var fullurl;

        if (this.agent == null) {
            // just check connection
            fullurl = this.localurl + this.accNotificationP + '?agentNo=' + "XX99999999XX" + '&sessionId=' + this.sessionId;
        }
        else {
            fullurl = this.localurl + this.accNotificationP + '?agentNo=' + this.agent.m_AgentNo + '&sessionId=' + this.sessionId;
        }
        var TT: any = this;
        var aaa: Observable<any> = this.httprequests.get<AccNotifications[]>(fullurl);
        aaa.subscribe(notification => {
            if (notification == undefined) {
                //if (TT.NotificationInterval != 5000) {
                    TT.NotificationInterval = 1000;
                    TT.timerSubscribe();
                //}
                TT.NoConnectionToAcc = true;
                TT.NoConnectionReason = 2; // Tomacat disconnected move to available tomact
                if (TT.tomactNotConnectedDate == 0) {TT.tomactNotConnectedDate = Math.floor (Date.now() / 1000);}
            }
            else if (notification.length > 0) {
                if (notification.length > 1 && TT.NotificationInterval > 250 && TT.NoConnectionToAcc == false) {
                    TT.NotificationInterval = 250; // every second
                    TT.countEmptyNotification = 0;
                    TT.timerSubscribe();
                }
                TT.HandleNotifications(notification);
                notification = [];
            }
            else {
                TT.countEmptyNotification++;
                if (TT.NotificationInterval == 250 && this.countEmptyNotification >= 5) {
                    TT.NotificationInterval = 1000; // every second
                    TT.countEmptyNotification = 0;

                    if (TT.agent != null && TT.agent.m_AgentStatus == AgentStatus.Idle) {
                        //TT.donthing = true;;
                    }
                    TT.timerSubscribe();
                }
                 // connection reconnected to web server
                if (TT.NoConnectionToAcc == true) {
                    if (TT.NoConnectionReason == 2) {
                        var now:any  = Math.floor(Date.now() / 1000);
                        var deltNotConnected =   now -  TT.tomactNotConnectedDate;
                        TT.tomactNotConnectedDate = 0;
                        if (deltNotConnected < 5){
                            TT.m_StartStatusDateSaved = null;
                            TT.NoConnectionReason = 0;
                            TT.NoConnectionToAcc = false;
                            TT.ForceLogToServer("***** Tomcat reconnect again after: " + deltNotConnected + " - proceed normal *****");
                        }
                        else{
                            TT.RestoreConnectionAcc();
                            TT.ForceLogToServer("***** Tomcat reconnect again after: " + deltNotConnected + " - relogon *****");
                        }
                    }
                    else if (TT.NoConnectionReason == 1) {// connected from tomcat to acc
                        console.log("else if (TT.NoConnectionReason == 1)-> restore connection")
                        TT.RestoreConnectionAcc();
                    }
                }
            }
        },
            error => {
                this.log('GetAccNotification() => agent notification  Error: ' + error.status);
                this.NoConnectionToAcc = true;
                TT.NoConnectionReason = 2; // Tomacat
                if (TT.tomactNotConnectedDate == 0){TT.tomactNotConnectedDate = Math.floor(Date.now() / 1000);}

                if (TT.agent != null){
                    TT.m_StartStatusDateSaved = TT.agent.m_AgentStateTime;
                }
    
        });
        // end subscribe
        if (this.NoConnectionToAcc == false && this.agent != null) {

            this.SetAgentStatus();
            this.CheckOnSecondBoubdry();
            if (this.isOpenCalls == true && this.CallStatus_ElapsedTime >= 0) {
                this.UpdateElapsedTime();
            }
        }
        // check other web severs to connect to
        else if (this.NoConnectionReason == 2)
        {
             for (let w = 0; w < this.AccWebServersURLS.length; ++w) {
                if (this.AccWebcurURLidx != w) // current localurl
                {
                    var url = this.AccWebServersURLS[w];
                    this.CheckUrl(url + this.appName, w);
                    break;
                }
            }           
        }
    }

   // ================================[ checkurlOK ] ===========================
   async checkurlOK(w)
   {
    this.localurl = this.AccWebServersURLS[w];
    this.AccWebcurURLidx = w;
    var params = "";
    var aeonixAppCenterParams = "";
    var urlparam = ",";
    var agentparams = "";
    if (this.agent != undefined) {
        agentparams =this.savedURLSearch + ((this.savedURLSearch) ? '&params=' : '\?params=');
        var a1 = this.agent.m_AgentNo + ',' + this.agent.m_Extension + ',' + this.agent.m_Password + ',';
        var a2 = ((this.agent.m_isLogon == true) ? 'true' : 'false') + ',' + ((this.userStatus.userReleased == true) ? 'true' : 'false') + ',';
        var a3 = this.agent.m_AgentStateTime.toString() + ',' + this.currentLang + ',' + this.sessionId;
        params = btoa(a1 + a2 + a3);
    }
    else { params = this.savedURLSearch; }
    if (this.isAeonixAppCenterOn) {
        aeonixAppCenterParams = '\&aeonixAppCenterParams=' + btoa(JSON.stringify(this.tokenService.getUser()));
    }

    window.location.assign(this.localurl + this.appName + agentparams +  params + aeonixAppCenterParams);
   }
  
  // ================================[ checkurlFailed ] ========================
  checkurlFailed(error)
  {
    // if (error == null)   {
    //     console.log("ping Failed: null");    
    // }
    // else {
    //     console.log("ping Failed: " + error.status);
    // }
    console.log("ping Failed: " + error.status);
    this.NotificationInterval = 5000;
  }
  // ================================[ CheckUrl ] ==============================
   CheckUrl(url:string,w: number)
    {
        var TT:AccAgentService = this;
        var fullurl = url + "/ping"; 
        var aaa:any = this.httprequests.ping(fullurl);
        var t: boolean = false;
        aaa.subscribe(ok => {
            if (ok == undefined) {
                return (TT.checkurlFailed(null))
                console.log("ping Failed");t = false; 
            }
            else {
                console.log("ping OK" + ok);t = true; 
                return(TT.checkurlOK(w))
            }
        },
        error =>{
            if (error.status == 200) {
                return( TT.checkurlOK(w))
            }
            return (TT.checkurlFailed(error))

         });
 
    }
    // ================================[  ] ===========================
    // goTo(page, title, url) {
    //     if ("undefined" !== typeof history.pushState) {
    //       history.pushState({page: page}, title, url);
    //     } else {
    //       window.location.assign(url);
    //     }
    //   }    
    // ==============[ Logonn agent ]==================================
    accLogon(loginUser: LoginUser) {
       this.NotificationInterval = 1000;
        this.timerSubscribe();
        if (this.agent != null)// && this.agent.m_isLogon == true)
        {
            this.m_isLogonSaved = this.agent.m_isLogon;
            this.agent = null;
        }
        var fullurl = this.localurl + this.accLoginP;
        loginUser.sessionid = this.sessionId;
        loginUser.version = this.ACCVERSION;
        var sss =  JSON.stringify(loginUser);
         console.log(sss);
         this.waitForLogin = true;
        this.waitForLoginTime = new Date();
        this.waitForLoginTime.setTime(this.waitForLoginTime.getTime() + (2 * 6* 10 * 1000));// 2 minutes
        this.httprequests.post<any>(fullurl, sss).subscribe(
            user => {
                if (user == undefined) // no connection
                {
                    this.NoConnectionToAcc = true;
                    return ('No connection to acc server');
                }
                if (user.desc == "No connection to acc") {
                    return ('No connection to acc server');
                }
                if (this.agent == null) {
                    this.agent = new Agent(loginUser); // ok request - wait for sm authentication
                }
                this.SetLoginStatus(false);

                this.log(user.description + ' Agent Id:' + user.agantId);
                //this.sse.Init(this,this.localurl + this.accSseP,loginUser.username,this.sessionId,this.localurl + this.accSseSubscribeP);

                //2020-05-18: AlisherM BZ#52606: there is no call and call profile in events like OnLogon, OnLogoff, etc.
                //Thus we can't use CPF like 'Agent Number' in these events. So we need to insert these CPF to "fake" call EmptyRsponse
                this.AddCPFtoCall("Agent Number", this.agent.m_AgentNo, EmptyRsponse);
                this.AddCPFtoCall("Agent Extension", this.agent.m_Extension, EmptyRsponse);
                return "";
            },
            error => {
                return 'agent logon Error' + error;

            });
    }

       // ==============[ Logonn-gate agent ]==================================
       accLogonJWT(loginUser: LoginUser) {
           this.NotificationInterval = 1000;
           this.timerSubscribe();
           if (this.agent != null)// && this.agent.m_isLogon == true)
           {
               this.m_isLogonSaved = this.agent.m_isLogon;
               this.agent = null;
           }
           var fullurl = this.localurl + this.accLoginPJWT;
           loginUser.sessionid = this.sessionId;
           loginUser.version = this.ACCVERSION;
           var sss =  JSON.stringify(loginUser);
           console.log(sss);
           this.waitForLogin = true;
           this.waitForLoginTime = new Date();
           this.waitForLoginTime.setTime(this.waitForLoginTime.getTime() + (2 * 6* 10 * 1000));// 2 minutes
           this.httprequests.post<any>(fullurl, sss).subscribe(
               user => {
                   if (user == undefined) // no connection
                   {
                       this.NoConnectionToAcc = true;
                       return ('No connection to acc server');
                   }
                   if (user.desc == "No connection to acc") {
                       return ('No connection to acc server');
                   }
                   if (user.agantId != null) {
                       loginUser.username = user.agantId;
                   }
                   if (this.agent == null) {
                       this.agent = new Agent(loginUser); // ok request - wait for sm authentication
                       this.agent.m_AgentNo = user.agantId;
                   }
                   this.SetLoginStatus(false);

                   this.log(user.description + ' Agent Id:' + user.agantId);
                   //this.sse.Init(this,this.localurl + this.accSseP,loginUser.username,this.sessionId,this.localurl + this.accSseSubscribeP);

                   //2020-05-18: AlisherM BZ#52606: there is no call and call profile in events like OnLogon, OnLogoff, etc.
                   //Thus we can't use CPF like 'Agent Number' in these events. So we need to insert these CPF to "fake" call EmptyRsponse
                   this.AddCPFtoCall("Agent Number", this.agent.m_AgentNo, EmptyRsponse);
                   this.AddCPFtoCall("Agent Extension", this.agent.m_Extension, EmptyRsponse);
                   return "";
               },
               error => {
                   return 'agent logon Error' + error;

               });
       }
       //
       //=================[Relogon]===============================
       Relogon() {
           let t:string= "Relogon_Note";
           this.trnslt.get(t).subscribe((text: string) => { t = text });
           this.ShowAlert(t);
           this.saveCredintial();

        //this.agentLogoff(true,false);
        this.RestoreConnectionAcc();
    }
        //=================[agentPreLogin]===============================
   agentPreLogin(fromReloadOrTabClosed: boolean) {
        var action = "logoff";
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + ", ," + this.agent.m_Extension + "," + fromReloadOrTabClosed);
        this.agent = null;

        //2019-05-05 AlisherM BZ#49794: disable click2dial on logoff
        if (this.isSalesforce) {
            this.salesforce.disableClickToDial();
        }
    }
    //=================[agentLogoff]===============================
    agentLogoff(isToLogout: boolean, fromReloadOrTabClosed: boolean) {
        this.saveEtasIni();
        if (fromReloadOrTabClosed == false) {this.ForceLogToServer("agent LOGOFF pushed");}
        else                                {this.ForceLogToServer("agent LOGOFF from RELOAD");}
        localStorage.setItem("AccWebAgentTop", window.screenTop.toString());
        localStorage.setItem("AccWebAgentLeft", window.screenLeft.toString());
        // first force logout
        if (isToLogout) {
            var action = "logout";
            this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + ", ," + this.agent.m_Extension + "," + String(this.userStatus.userReleased));
            //localStorage.removeItem("SavedUrlSearch");

        }
        this.HandleCRMEvent("OnLogoff", EmptyRsponse);
        ///this.delay(1000);
        this.agentPreLogin(fromReloadOrTabClosed);
        this.agaenLogin.auto = 0;
        this.agaenLogin.ringsecs = 0;
        this.userStatus = new UserStatusModel();
        this.agaenLogin.username = "";

           if (this.isGateLogin()) {this.authService.logout();}
           this.router.navigateByUrl('/' + this.savedURLSearch);

    }
    // ==============[  isGateLogin  ]==================================
    isGateLogin(): boolean {
        return (this.authService.tokenService.getToken() != null &&
                this.authService.tokenService.getToken().length > 0 &&
                this.authService.tokenService.getToken() != undefined);
    }
    // ==============[  isGateLogin  ]==================================
    isGateSignOut(): boolean {
        return (this.authService.tokenService.isSignOut() == true);
    }
    // ================================================[agentrequest]================================================
    accRequests(notification: AccNotifications) {
        notification.sessionid = this.sessionId;
        var fullurl = this.localurl + this.accrequestP;
        this.httprequests.put(fullurl, JSON.stringify(notification));
        // if (notification.action != "keepalive") {
        //     this.log(notification.params);
        // }
    }
    //===============================================================
    //===============================================================
    // ======================================================================
    PrepareAndPutNotification(action: string, prams: string) {
        var accNotifications = new AccNotifications("t_s", this.agent.m_AgentNo, action, prams);
        accNotifications.sessionid = this.sessionId;
        this.accRequests(accNotifications);
    }
    // ==================================================================
    showSnackBar(name): void {
        const config: any = new MatSnackBarConfig();
        config.duration = AppConfig.snackBarDuration;
        this.snackBar.open(this.translations[name], 'OK', config);
    }
    // ==================================================================
    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {

            // TODO: send the error to remote logging infrastructure
            console.error(error); // log to console instead

               // TODO: better job of transforming error for user consumption
               this.log(`${operation} failed: ${error.message}`);

               // Let the app keep running by returning an empty result.
               return of(result as T);
           };
       }
       // ========================[SetNewStateTime]===================================
       public SetNewStateTime() {
           //this.log("Before SetNewStateTime - " + this.agent.m_AgentStateTime);
           if (this.agent.m_LastReleaseStateTime != null) {
               //this.log("Before SetNewStateTime - " + this.agent.m_AgentStateTime + " (from m_LastReleaseStateTime)");
               this.agent.m_AgentStateTime = this.agent.m_LastReleaseStateTime;
           }
           else {
               //this.log("Before SetNewStateTime - " + this.agent.m_AgentStateTime + " (from Date.now())");
               this.agent.m_AgentStateTime = Date.now();
           }
           //this.log("After SetNewStateTime - " + this.agent.m_AgentStateTime);
           //this.agent.m_LastReleaseStateTime = null;
       }

       // ========================[CheckClearACDCall]=================================================
       CheckClearACDCall() {
           for (var idx = 0; idx < this.callsArray.length; ++idx) {
               if (this.callsArray[idx].m_To == this.agent.m_Extension && this.callsArray[idx].m_Acd == "ACD") {
                   this.HandleCRMEvent("OnClearedACD", this.callsArray[idx]);
                   this.callsArray[idx].m_CallPrevState =  this.callsArray[idx].m_CallState ;
                   this.ClearCall(idx);
                   return;
               }
           }

       }
       // ========================[getLastCallIdxByCallState]=================================================
       getLastCallIdxByCallState(state: AccCallState) {
           var date = new Date(Date.UTC(0, 1, 1, 0, 0, 0));
           var idx = -1;
           var found = -1;
           this.callsArray.forEach(function (call: OneCall) {
               ++idx;
               if (call.m_CallState == state) {
                   if (date.getTime() < call.m_StartStatusDate.getTime()) {
                       date = call.m_StartStatusDate;
                       found = idx;
                   }
               }
           });
           //this.agent.m_CallIndex = found;
           return found;

       }
       // ============================= Update m_StartConsultation ==============================
       updateStartConsultation(b: number,to:string) {
           if (b != -1) {
               this.agent.m_StartConsultation = b;
               this.agent.m_StartConsultationTo = to;
               this.agent.m_StartConsultationAnswered = false;
               return true;
           }
           return false;
       }
       // ============================= getCurrentCallId ==============================
       getCurrentCallId() {
           if (this.agent.m_CallIndex != -1) {
               return this.callsArray[this.agent.m_CallIndex].m_CallId;
           }
           else return "";
       }
       // ============================= getCurrentCall ==============================
       getCurrentCall() {
           if (this.agent.m_CallIndex != -1) {
               return this.callsArray[this.agent.m_CallIndex];
           }
           else return null;
       }
       // ============================= getCurrentRowCallId ==============================
       getCurrentRowCallId() {
           if (this.agent.m_CallIndex != -1) {
               return this.callsArray[this.agent.m_CallIndex];
           }
           else return null;
       }
       //
       // ========================[GetCallByCallId]===================================
       public GetCallByCallId(callId: string) {
           var index = this.callsArray.map(e => e.m_CallId).indexOf(callId);
           if (index == -1) {
               this.log("No sush call id: " + callId);
               return -1;
           }
           return index;
       }

       // ============================[toggleCall]=================================
       toggleCall() {
           if (this.callsArray.length < 2) { return; }
           this.agent.m_CallIndex++;
           if (this.agent.m_CallIndex == this.callsArray.length) {
               this.agent.m_CallIndex = 0;
           }
           this.updateCallsCount();
           this.callIconType = 'assets/images/CallTypeIcons/no_icon.ico';
           if (this.callsArray[this.agent.m_CallIndex].m_Acd == "ACD") { this.callIconType = 'assets/images/CallTypeIcons/incoming_acd.ico'; }
           if (this.callsArray[this.agent.m_CallIndex].m_Acd == "OMNI") { this.callIconType = 'assets/images/CallTypeIcons/media_chat.ico'; }
           if (this.callsArray[this.agent.m_CallIndex].m_Acd == "OACD") { this.callIconType = 'assets/images/CallTypeIcons/outbound_callback.ico'; }
           if (this.callsArray[this.agent.m_CallIndex].m_CallState == AccCallState.Ringing) {
               this.StartRinging(this.agent.m_CallIndex);
           }
       }
       // ============================[toggleCall]=================================
       updateCallsCount() {
           this.log("updateCallsCount: " + this.callsArray.length);
           if (this.callsArray.length < 1) { this.callsCount = ""; this.agent.m_CallIndex = -1; return; }
           for (var idx = 0; idx < this.callsArray.length; ++idx) {
               if (idx == this.agent.m_CallIndex) {
                   this.callsCount = '' + (idx + 1) + " / " + (this.callsArray.length);
                   break;
               }
           }
       }

       // ============================[StartRinging]=================================
       StartRinging(index) {
           this.agent.m_AgentStatus = AgentStatus.Ringing;
           this.fa_step_forward = this.step_no_ring;
           this.CheckRinging();
           if (this.callsArray[index].m_Acd == "ACD")
           {
               this.HandleCRMEvent("OnIncomingACD", this.callsArray[index]);
           }
           else
           {
               this.HandleCRMEvent("OnIncoming", this.callsArray[index]);
           }
           if (document.hasFocus() == false) {
               //if (this.callsArray[index].m_Acd == "ACD") {
               //var a = this.etasIni.CRM.find(x => x.Event === callEvent);
               //}
               this.notifyMe(this.agent.m_AgentNo, "Ringing: " + this.callsArray[index].m_From);
           }
       }
       // ============================= UpdateAgentStatus =====================
       UpdateAgentStatus(idx: number) {
           var s: AgentStatus = this.agent.m_AgentStatus;
           if (idx < 0 || this.callsArray.length == 0) { return; }
           var call: OneCall = this.callsArray[idx];
           if (this.agent.m_AgentStatus == AgentStatus.OACD) {
               return;
           }
           if (this.agent.m_AgentStatus == AgentStatus.Ringing){
               return;
           }
           //
           this.agent.m_AgentStatus = AgentStatus.Busy;
           if (this.callsArray[idx].m_CallState == AccCallState.RESERVED)
           {
               this.agent.m_AgentStatus = AgentStatus.RESERVED;
           }
           if (call.m_Acd == "ACD") { this.agent.m_AgentStatus = AgentStatus.ACD; }
           if (call.m_Acd == "OMNI") { this.agent.m_AgentStatus = AgentStatus.Omni; }
           if (call.m_Acd == "OACD") { this.agent.m_AgentStatus = AgentStatus.OACD; }
           if (this.agent.m_AgentStatus == AgentStatus.Logout) {
               this.agent.m_AgentStatus = AgentStatus.LogoutBusy;
               if (call.m_Acd == "ACD") { this.agent.m_AgentStatus = AgentStatus.LogoutAcd; }
           }
       }
       // ============================= getMostRecentCallIdx ==================
       public getMostRecentCallIdx() {
           var date = new Date(Date.UTC(0, 1, 1, 0, 0, 0));
           var idx = -1;
           var call: OneCall = null;
           var foundCall: OneCall = null;
           var found = -1;
           for (var idx = 0; idx < this.callsArray.length; ++idx) {
               call = this.callsArray[idx];
               if (call.m_CallState != AccCallState.Cleared) {
                   if (date.getTime() < call.m_StartStatusDate.getTime()) {
                       date = call.m_StartStatusDate;
                       found = idx;
                       foundCall = call;
                   }
               }
           }
           if (foundCall == null) {
               this.agent.m_AgentStatus = AgentStatus.DontCare;
           }
           else {
               if (foundCall.m_CallState == AccCallState.Ringing) {
                   console.log("getMostRecentCallIdx=> start ringing most recent");
                   this.StartRinging(found);
               }
               else if (this.agent.m_AgentStatus == AgentStatus.Ringing) {
                   console.log("getMostRecentCallIdx=> change call status of most recent to busy /acd ");
                   this.agent.m_AgentStatus = AgentStatus.Busy;
               }
           }

           this.agent.m_CallIndex = found;
           return found;

       }

       //=========================== [InsertUpdateCP] ================================
       InsertUpdateCP(oc: Key_Desc[], cpf: Key_Desc, pos: number) {
           var index = oc.map(e => e.Id).indexOf(cpf.Id);
           if (cpf.Desc == "") return;
           if (index != -1) // insert new in pos
           {
               oc[index] = cpf; // add in specific place in array
           }
           else {
               oc.push(cpf);
           }
       }

       //
       //=========================== [replaceall] ================================
       replaceall(s: string, from: string, to: string) {
           if (s == '') { return s };
           var v = s.split(from);
           var r: string = v[0];
           for (let i = 1; i < v.length; i++) {
               r += to;
               r += v[i];
           }
           return r;
       }

       //=========================== [prepareCP] ================================
       public CP: any = [];
       prepareCP(CpArray: string[], oc: OneCall) {
           // loop on agent calls status requested fields
           //oc.m_CP = [];
           var t: string;
           for (let i = 0; i < this.CP.length; i++) {
               var idx: number = Number(this.CP[i].Index);
               // mandatory CP

               if (idx < 10000) {
                   for (let j = 0; j < CpArray.length; j++) {
                       var x: number = 2;
                       var cols: any = CpArray[j].split('|');
                       if (cols.length < 3) { x = 1; }
                       if (cols[0] == this.CP[i].Index) {
                           var aa:string = cols[x];
                           if (this.CP[i].Index == CP_CODES.SERVICE_ID) {
                               var jj = this.ACC.m_ServiceList.map(e => e.Key).indexOf(cols[x]);
                               if (jj != -1) {
                                   aa = this.ACC.m_ServiceList[jj].Desc;
                               }
                           }
                           aa =this.replaceall(aa,'@#$',',');
                            var cpf: any = new Key_Desc(this.CP[i].Header, aa, cols[0]);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       }
                   }
               }
               else {
                   var cpf: any;
                   switch (idx) {
                       case CP_EXT.IDX_CALLS_STAT_CALL_ACD_GROUP:
                           var sss: string = oc.m_AcdGroup;
                           var idxx = this.ACC.m_GroupsList.map(e => e.Key).indexOf(oc.m_AcdGroup);
                           if (idxx != -1) {
                               sss = this.ACC.m_GroupsList[idxx].Desc;
                           }
                           cpf = new Key_Desc(this.CP[i].Header, sss, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_ANI:
                           cpf = new Key_Desc(this.CP[i].Header, oc.m_From, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_CALLED:
                           cpf = new Key_Desc(this.CP[i].Header, oc.m_To, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_CALLING_DEV:
                           cpf = new Key_Desc(this.CP[i].Header, oc.m_From, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_ELAPSED_TIME:
                           cpf = new Key_Desc(this.CP[i].Header, "Empty", '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           this.CallStatus_ElapsedTime = i;
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_LAST_REDIRECTION:
                           cpf = new Key_Desc(this.CP[i].Header, oc.m_LastRedirect, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_ORIG_CALLED:
                           cpf = new Key_Desc(this.CP[i].Header, oc.m_OriginalCalled, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA:
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_STATE:
                           cpf = new Key_Desc(this.CP[i].Header, AgentCallStateTxt[oc.m_CallState], '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_TIME:
                           t = this.getTwentyFourHourTime(oc.m_StartStatusDate);
                           cpf = new Key_Desc(this.CP[i].Header, t, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_EXPAND_MEDIA:
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA_ICON:
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA_ICON:
                           break;
                       case CP_EXT.IDX_CALLS_STAT_CALL_START:
                           t = this.getTwentyFourHourDateTime(oc.m_StartStatusDate);
                           cpf = new Key_Desc(this.CP[i].Header, t, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_CALL_END:
                           t = this.getTwentyFourHourDateTime(oc.m_EndStatusDate);
                           cpf = new Key_Desc(this.CP[i].Header, t, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       case CP_EXT.IDX_CALLS_STAT_JOINING_CALL:
                           cpf = new Key_Desc(this.CP[i].Header, oc.m_To1, '' + idx);
                           this.InsertUpdateCP(oc.m_CP, cpf, i);
                           break;
                       //
                       default: break;
                   }
               }
           }
           return oc;
       }
       getCpOneEntry(CpArray: string[], key: string) {
           var index: number;
           for (let i = 0; i < CpArray.length; i++) {
               var cols: any = CpArray[i].split('|');
               if (cols[0] != key) continue;
               return cols[2];
           }
           return "";
       }
       // ===================[ UpdateFromToCP ]========================================
       public UpdateFromToCP(response: string[]) {
           var index = this.callsArray.map(e => e.m_CallId).indexOf(response[1]);
           if (index == -1) {
               var oc: OneCall = new OneCall(response[1]);
               if (response[0] != this.agent.m_Extension) {
                   oc.m_From = response[0];
                   oc.m_To = this.agent.m_Extension;
               }
               else {
                   oc.m_To = response[0];
                   oc.m_From = this.agent.m_Extension;
               }
               this.callsArray.push(oc);
               index = this.callsArray.map(e => e.m_CallId).indexOf(response[1]);
           }
           var cps: any = response[5].split('^');
           var ANI = this.getCpOneEntry(cps, "2");

           this.callsArray[index].m_Acd = response[4];

           this.callsArray[index].m_StartStatusDate = new Date();
           this.log("UpdateFromToCP()\n        Call Id: " + this.callsArray[index].m_CallId +
               "\n        From: " + this.callsArray[index].m_From +
               "\n        To: " + this.callsArray[index].m_To +
               "\n        ACD: " + response[4] +
               "\n        reponse[6]: " + response[6] +
               "\n        state: " + response[3]);
           var state = AgentCallStateTxt.indexOf(response[3]);
           this.callsArray[index].m_CallState = state;
           this.prepareCP(cps, this.callsArray[index]);

           this.prepareCallStatusGridData();


           return index;
       }
       // ===========================================================
       public m_CallState: AccCallState = AccCallState.DontCare;
       // =====================[ UpdateFromToCallId ]======================================
       public UpdateFromToCallId(response: string[], state: AccCallState) {
           // remove resereved call if exists
           var iii = this.callsArray.map(e => e.m_CallState).indexOf(AccCallState.RESERVED);
           if (iii != -1) {this.callsArray.splice(iii,1); }
           //

           if(response[3] == "whisper")
           {
               if(state == AccCallState.Connected)
                   this.getCurrentCall().m_whisper = response[6];
               else if(state == AccCallState.Cleared)
                   this.getCurrentCall().m_whisper = "";
           }

           else
           {
               var index = this.callsArray.map(e => e.m_CallId).indexOf(response[12]);

               if (index == -1) {
                   if (state == AccCallState.Cleared) {
                       return this.getMostRecentCallIdx();
                   }
                   var oc: OneCall = new OneCall(response[12]);
                   this.callsArray.push(oc);
                   index = this.callsArray.map(e => e.m_CallId).indexOf(response[12]);
               }
               if (response[3] != "") this.callsArray[index].m_Direction = response[3];
               if (response[6] != "" &&  state != AccCallState.Cleared) this.callsArray[index].m_From = response[6];
               if (response[7] != "" &&  state != AccCallState.Cleared) this.callsArray[index].m_To = response[7];
               if (response[7] != "" &&  state != AccCallState.Cleared) this.callsArray[index].m_JoiningCalled = response[7];
               if (response[8] != "") this.callsArray[index].m_OriginalCalled = response[8];
               if (response[9] != "") this.callsArray[index].m_LastRedirect = response[9];
               if (state == AccCallState.Conferenced) {
                   this.callsArray[index].m_To1 = response[8];
               }
               this.callsArray[index].m_Acd = response[14];
               if (this.callsArray[index].m_CallState != AccCallState.Ringing) {
                   // this.callsArray[index].m_StartStatusDate = new Date();
               }
               else {
                   this.CheckPauseAudio();
               }
               this.m_CallState = state;

               this.log("UpdateFromToCallId()=>\n        Call Id: " + this.callsArray[index].m_CallId +
               "\n        Action: " + response[2] +
               "\n        From: " + this.callsArray[index].m_From +
               "\n        To: " + this.callsArray[index].m_To +
               "\n        ACD: " +this.callsArray[index].m_Acd +
               "\n        reponse[5]: " + response[5] +
               "\n        state: " + AgentCallStateTxt[state]);
               this.callsArray[index].m_CallPrevState = this.callsArray[index].m_CallState;
               if (state != AccCallState.Transferred) {
                   this.callsArray[index].m_CallState = state;
               }
               //
               if (state == AccCallState.Cleared) {
                   if (this.callsArray[index].m_Acd == "ACD")
                   {
                       this.HandleCRMEvent("OnClearedACD", this.callsArray[index]);
                   }
                   else
                   {
                       this.HandleCRMEvent("OnCleared", this.callsArray[index]);
                   }

                   this.ClearCall(index);
               }
               else {
                   if (response[2] == "Delivered") {
                       this.callsArray[index].m_Direction = "";
                       this.callsArray[index].m_AcdGroup = response[3];
                   }
                   var cps: any = response[4].split('^');
                   this.prepareCP(cps, this.callsArray[index]);
                   this.prepareCallStatusGridData();
               }
               return index;
           }
           return -1;
       }
       //
       // ============================[ClearCall]=================================
       ClearCall(index: number) {
           this.SetNewStateTime();
           if (index == -1) { return; }
           if (this.agent.m_StartConsultation == index || this.agent.m_StartConsultationTo == this.callsArray[index].m_To)
           {
               this.agent.m_StartConsultation = -1;
               this.agent.m_StartConsultationHeld = -1;
               this.agent.m_StartConsultationTo = "";
               this.agent.m_StartConsultationAnswered = false;
               this.setAccButton("ConferenceCompleteId",0,false);
           }
           this.callsArray[index].m_EndStatusDate = new Date();

           this.MoveCallToHistory(index);
           this.prepareCallStatusGridData();
           this.getMostRecentCallIdx();
           this.updateCallsCount();
           this.sendStatisticsRequest();
       }

       // =========================== [ClearCallsMap] ================================
       ClearCallsMap() {
           var idx = 0;
           let b:Boolean = false;

           for (idx = 0; idx < this.callsArray.length; ++idx) {
               this.callsArray[idx].m_CallPrevState = this.callsArray[idx].m_CallState;
               if (this.callsArray[idx].m_Acd == "N"){
                   b = true;
                   this.HandleCRMEvent("OnCleared", this.callsArray[idx]);
               }
              else {b = false;}
               this.MoveCallToHistory(idx);
           }
           this.callsArray = [];
           this.prepareCallStatusGridData();
           this.agent.m_CallIndex = -1;
           this.updateCallsCount();
           return b;

       }
       // ===================[ MoveCallToHistory ]=======================================
       MoveCallToHistory(idx: number) {
           var oc: OneCall = this.callsArray[idx];
           oc.m_CallState = oc.m_CallPrevState;
           if (oc.m_DeliveredResponse.length > 0) {
               this.callsLog.splice(0, 0, oc);
               this.prepareCallLogGridData();
           }
           this.callsArray.splice(idx, 1);
       }
       // ==========================================================
       public RequestStop() {
           // shouldStop = true;
       }
       wait = ms => new Promise((r, j) => setTimeout(r, ms));
       // =========================== [DisconnectAll] ================================
       ClearAllCall() {
           var action = 'disconnectcall';
           while (this.callsArray.length > 0) {
               var oc: OneCall = this.callsArray.pop();
               this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + oc.m_CallId + "," + this.agent.m_Extension);
           }
           this.prepareCallStatusGridData();
           //this.wait(1000);
       }


       // =========================== [resolveAfter2Seconds] ================================
       resolveAfter2Seconds(x) {
           return new Promise(resolve => {
               setTimeout(() => {
                   resolve(x);
               }, 2000);
           });
       }

       // =========================== [RestoreConnectionAcc] ================================
       public RestoreConnectionAcc() {
           this.NoConnectionToAcc = false;
           var noconnReason = this.NoConnectionReason;
           this.NoConnectionReason = 0;
           if (this.agent != null) {
               this.m_isLogonSaved = this.agent.m_isLogon;
               if (this.m_StartStatusDateSaved != null) {
                   //this.log("Before RestoreConnectionAcc - " + this.agent.m_AgentStateTime);
                   this.agent.m_AgentStateTime = this.m_StartStatusDateSaved;
                   //this.log("After RestoreConnectionAcc - " + this.agent.m_AgentStateTime);
               }
               this.NoConnectionReason = 99;
               this.accLogon(new LoginUser(this.agent.m_AgentNo,this.agent.m_Password, this.agent.m_Extension));
               //this.saveCredintial();
               //this.agent = null;
            }
            else
            {
               this.agaenLogin.username = "";
                this.router.navigateByUrl('/' + this.savedURLSearch);

            }
            ///location.reload(true);

       }

       public HandleNotification(notification: AccNotifications)// string agentNo,int checkInterval,int checkCount, AgentStatus CheckedAgentStatus, AgentStatus CheckedCallStatus, out Agent A,out string err)
       {
           try {
               var n1 = notification.params;
               var sessionid = notification.sessionid;

               var response = n1.split(',');
               if (response.length < 2) {
                   return;
               }
               var action: string;
               var index = -1;
               action = response[2];
               //if (action.substr(0, 2) != "__") this.log(i + " => " + n1);

               var desc = response[5];
               var id = response[12];
               //2020-07-01 AlisherM BZ#51192: return comma sign to call profile fields value: '@#$' => ','
               response[4] =this.replaceall(response[4],'@#$',',');
               var cps: any = response[4].split('^');
               //2019-10-08 AlisherM BZ#50840: print action for debug
               this.log("HandleNotifications recieved action: " + action + " (" + response[3] + ")");
               switch (action) {
                   //
                   case "__SSOStatus":
                       this.log("__SSOStatus" + notification.agentNo + " " + notification.params);
                       break;
                   //
                   case "__NoConnectionToAcc":
                       this.NoConnectionToAcc = true;
                       this.NoConnectionReason = 1; //acc server fail
                       if (this.agent != null){
                           this.m_StartStatusDateSaved = this.agent.m_AgentStateTime;
                       }
                       //if (this.NotificationInterval != 5000) {
                           this.NotificationInterval = 1000;
                           this.timerSubscribe();
                       //}
                       break;
                   //
                   case "__ConnectionToAcc":
                       this.RestoreConnectionAcc();
                       break;
                   //
                   case "logon":
                       this.agent.m_Logon = true;
                       this.agent.m_isRecording = false;
                       this.agent.m_isRecordingSuspended = false;

                       //this.agaenLogin.extension = response[6];
                       if (this.isSSO == true) {
                           this.SSOuser = this.agent.m_AgentNo;
                           this.agent.m_AgentNo = response[1];
                       }
                       if (response[11] == '1') {
                           this.agent.m_Sup = true;
                       }
                       this.agaenLogin.password = this.b64DecodeUnicode(response[9]);
                       var pwd =  Md5.hashStr(this.sessionId + ':' + this.agaenLogin.password);
                       this.agaenLogin.password = pwd as string;
                       this.agent.m_Password = this.agaenLogin.password;

                       this.agaenLogin.username = response[1];
                       this.agaenLogin.name = this.b64DecodeUnicode(response[7]);
                       this.agaenLogin.extension = this.agent.m_Extension;
                       var cos: any = response[3].split('|');
                       var TRUE: boolean = true;
                       this.winDisableCount = 0;
                       for (var ii: number = 1; ii < cos.length; ++ii) {
                           TRUE = true;
                           if (cos[ii] == "0") { TRUE = false; }
                           // set COS flag
                           this.agent.m_COS[ii - 1] = TRUE;
                       }
                       this.agaenLogin.primary_groups = response[4].split('|');
                       //this.isMainPageReady = false;
                       this.callsArray = [];
                       this.getAllLists();
                       this.PrepareAndPutNotification("QueryAgentCalls", "QueryAgentCalls" + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + ",");
                       this.PrepareAndPutNotification("getservices", "getservices" + ",000," + this.agent.m_AgentNo + ", ,");
                       break;
                   //
                   case "logoff":
                       this.isGrids = false;
                       this.agent = null;
                       this.timerUnSubscribe();
                       //LoggerService.log("logoff agent");
                       this.saveEtasIni();
                       this.ClearCredintial();
                       this.agaenLogin.username = "";
                        this.router.navigateByUrl('/' + this.savedURLSearch);

                       break;
                   //
                   case "ReLogon":
                       this.Relogon();
                       break;
                   //
                   case "deviceStatus":
                       var deniedStr: string = "";
                       //this.log("deviceStatus: " + response[3]);
                       switch (response[3]) {
                           case "DND":
                               this.agent.m_DND = true;
                               deniedStr += "Device status: DND";
                               break;
                           //
                           case "DND_CANCELED":
                               if (this.agent.m_DND == true) {
                                   this.agent.m_DND = false;
                                   deniedStr += "Device status -DND canceled";
                               }
                               break;
                           //
                           case "OUT_OF_SERVICE":
                               this.agent.m_DND = false;
                               deniedStr += "Device status - out of service";
                               //this.agentLogoff(true, false); // back to logon screen
                               break;
                           //
                           case "MDU_PREVENT_LOGIN":
                               if (this.agent == null) {return;}
                               //this.agentLogoff(true, false); // back to logon screen
                               deniedStr += "Device status - MDU PREVENT LOGIN";
                               break;
                           //
                           case "BUSY":
                               this.agent.m_AgentStatus = AgentStatus.SemiBusy;
                               console.log("DEVICE BUSY");
                               break;
                           //
                           case "SUSPEND_RECORDING_FAILED":
                               if (this.agent == null) {return;}
                               //this.agentLogoff(true, false); // back to logon screen
                               deniedStr += "Suspend Recording Failed";
                               break;
                           //
                           case "RESUME_RECORDING_FAILED":
                               if (this.agent == null) {return;}
                               //this.agentLogoff(true, false); // back to logon screen
                               deniedStr += "Resume Recording Failed";
                               break;
                       }
                       if (deniedStr != "") {
                           this.ShowAlert(deniedStr);
                       }
                       break;
                   //
                   case "agentTimeoutDenied":
                       //2019-06-20 AlisherM & Shaul BZ#50087: prevent sending wrong notification 'Login failed: wrong password' when agent forced logoff due to timeout
                       this.HandleCRMEvent("OnDenied", EmptyRsponse);
                       this.agaenLogin.username = "";
                       this.ShowAlert(eDenyCauseStr[response[10]]);
                       this.router.navigateByUrl('/' + this.savedURLSearch);

                       //this.agentLogoff(true); // back to logon screen
                       break;
                   //
                   case "agentDenied":
                       //2019-06-20 AlisherM & Shaul BZ#50087: prevent sending wrong notification 'Login failed: wrong password' when agent forced logoff due to timeout
                       this.HandleCRMEvent("OnDenied", EmptyRsponse);
                       this.agaenLogin.username = "";
                       this.waitForLogin = false;
                       this.router.navigateByUrl('/' + this.savedURLSearch);
                       if (this.NoConnectionReason == 99 && response[10] == '11') {
                           this.NoConnectionReason  = 0;
                           break;
                       } // in case of fisconnecnet or relogon
                       this.NoConnectionReason  = 0;
                       this.ShowAlert(eDenyCauseStr[response[10]],response[4]);
                       //this.agentLogoff(true); // back to logon screen
                       break;
                   //
                   case "agentCauses":
                       this.ShowAlert(response[3]);
                       break;
                   //
                   case "forcedLogoff":
                       var deniedStr = eDenyCauseStr[response[10]];
                       this.ShowAlert(deniedStr,response[4]);
                       this.agent.m_Logon = false;
                       this.agent.m_AgentNo = "";
                       LoggerService.log("forcedLogoff agent");
                       //this.HandleCRMEvent("OnDenied", EmptyRsponse);
                       //this.saveEtasIni();
                       this.agent = null;
                       this.ClearCredintial();
                       this.agaenLogin.username = "";
                       this.router.navigateByUrl('/' + this.savedURLSearch);
                      break;
                   //
                   case "login":
                       //2019-10-08 AlisherM BZ#50840: NOTE: function displayOnLogonImage will not change login status of agent, this will be done by SetLoginStatus in order to prevent duplicate OnLoggedIn events
                       this.SetLoginStatus(true);
                       var isPrimary = this.HandleloginPrimaryLogoutGroups(response[13], true);
                       if (this.isMainPageReady == true) {
                           this.displayOnLogonImage(isPrimary);
                       }

                       this.PrepareAndPutNotification("QueryAgentCalls", "QueryAgentCalls" + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + ",");

                       break;
                   //
                   case "logout":
                       var isPrimary = this.HandleloginPrimaryLogoutGroups(response[13], false);
                       if (this.isMainPageReady == true) {
                           this.agentsReadyList = [];
                           this.setAccButton("transferToAgentNoId", 0, false);
                           this.displayOffLogonImage(isPrimary);
                       }
                       break;
                   //
                   case "resume":
                       if (this.userStatus.userLogin == false) {
                           // do not change release/resume state on logout state
                           break;
                       }
                       this.userStatus.userReleased = false;
                       if (this.isMainPageReady == true) {
                           this.displayOnOffreleaseImage();
                       }
                       console.log("got resume");
                       this.HandleCRMEvent("OnResumed", EmptyRsponse);
                       this.sendStatisticsRequest();
                       break;
                   //
                   case "release":
                       if (this.userStatus.userLogin == false) {
                           // do not change release/resume state on logout state
                           break;
                       }

                       var previous_released_status: boolean = this.userStatus.userReleased;
                       console.log("got release, previous_released_status: " + previous_released_status);
                       this.userStatus.userReleased = true;
                       if (response[3] == "code") {
                           this.agent.ReleaseCode = response[10];
                       }
                       else {
                           this.agent.ReleaseCode = "01";
                       }
                       if (this.isMainPageReady == true) {
                           this.displayOnOffreleaseImage();
                       }

                       //2019-10-07 AlisherM BZ#50840: prevent handling OnReleased event if agent already in release status
                       if (previous_released_status == false)
                       {
                           this.HandleCRMEvent("OnReleased", EmptyRsponse);
                       }
                       this.sendStatisticsRequest();
                       break;
                   //
                   case "grouploginstatus":
                       break;
                   //
                   case "callrecordingOnOff":

                   //2023-09-07 NivD BZ#58203: NOTE: Support Suspend/Resume call recording
                   // for (let j = 0; j < 14; j++) {this.log("callrecordingOnOff(~) - response["+j+"]: "+ response[j]);}
                   this.agent.m_isRecording = (Number(response[10]) == 1);
                   this.agent.m_isRecordingSuspended = (Number(response[11]) == 1);
                   this.callIconRecord = 'assets/images/CallTypeIcons/Record'+
                       (!this.agent.m_isRecording ? 'Unactive' :
                           (!this.agent.m_isRecordingSuspended ? 'On' : 'Paused'))+'.svg';


                   // Telephony Button - Recording On/ Off
                   var idx =Number(response[10]);
                   if (this.tiles != null) {
                       this.setAccButton("recordingOnId", idx, false);
                   }
                   this.log("callrecordingOnOff: response[4](URL) " + response[4] + ", response[10](status) " + response[10]);
                   if(response[3] == "ROD"){
                       this.agent.m_isRecording = (idx == 1);
                   }
                   else if(response[3] == "REC_LINK")
                   {
                       this.AddCPFtoCall("Recording File Name", response[4], this.getCurrentCall());
                   }
                   break;
                   //
                   case "ConfirmOutboundCallRequest":
                       this.CallbackCallId = Number(response[12]);
                       this.CallBackTimer =  Number(response[10]);
                       this.ConfirmCallBack = true;
                       break;
                   //
                   case "ForcedWrapupCode":
                       this.accagentPage.ChooseWrapCode(true);
                       break;
                   //
                   case "updateagentmode":
                       var rsrvdidx = this.callsArray.map(e => e.m_CallState).indexOf(AccCallState.RESERVED);
                       if (rsrvdidx != -1) {
                           this.callsArray.splice(rsrvdidx,1);
                           this.agent.m_AgentStatus = AgentStatus.DontCare;
                           this.getMostRecentCallIdx();
                       }
                       switch (response[3]) {
                           case "idle":
                              console.log("got updateagentmode: idle");
                              //this.log("Before: m_AgentStateTime - " + this.agent.m_AgentStateTime + ", m_StartStatusDateSaved - " + this.m_StartStatusDateSaved);

                               let b: Boolean =  this.ClearCallsMap();
                               this.agent.isOmni = false;
                               this.agent.m_StartConsultation = -1;
                               this.agent.m_StartConsultationHeld = -1;
                               this.agent.m_StartConsultationTo = "";
                               this.agent.m_StartConsultationAnswered = false;
                               //1-Nov-2023 YR BZ#57958
                               this.agent.m_LastReleaseStateTime = null;
                               this.setAccButton("ConferenceCompleteId",0,false);
                               if ( this.agent.m_AgentStatus !=  AgentStatus.Idle)
                               {
                                   if (this.m_StartStatusDateSaved != null)
                                   {
                                       //this.log("SET m_AgentStateTime FROM this.m_StartStatusDateSaved - " + this.m_StartStatusDateSaved);
                                       this.agent.m_AgentStateTime = this.m_StartStatusDateSaved;
                                       this.m_StartStatusDateSaved = null;
                                   }
                                   else
                                   {
                                       this.SetNewStateTime();
                                   }
                               }
                               this.SetLoginStatus(true);
                               this.userStatus.userReleased = false;
                               //if (b == true)
                               if ((b == true) && (this.agent.m_LastIdleStateTime != null))
                               {
                                   //this.log("SET m_AgentStateTime FROM m_LastIdleStateTime - " + this.agent.m_LastIdleStateTime);
                                   this.agent.m_AgentStateTime = this.agent.m_LastIdleStateTime;
                               }
                               this.agent.m_LastIdleStateTime = this.agent.m_AgentStateTime;
                               this.agent.m_AgentStatus = AgentStatus.Idle;
                               this.agent.ReleaseCode = "01";
                               this.displayOnLogonImage(true);
                               this.displayOnOffreleaseImage();
                               // cannot be calls in idle state;
                               //this.ClearCallsMap();
                               //this.log("After: m_AgentStateTime - " + this.agent.m_AgentStateTime + ", m_StartStatusDateSaved - " + this.m_StartStatusDateSaved);

                               break;
                           case "unavailable":
                               console.log("got updateagentmode: unavailable");
                               if ( this.agent.m_AgentStatus !=  AgentStatus.Release)
                               {
                                   if (this.m_StartStatusDateSaved != null)
                                   {
                                       this.agent.m_AgentStateTime = this.m_StartStatusDateSaved;
                                       this.m_StartStatusDateSaved = null;
                                   }
                                   else
                                   {
                                       this.SetNewStateTime();
                                   }
                               }
                               //this.log("m_AgentStateTime      - " + this.agent.m_AgentStateTime);
                               //this.log("m_StartStatusDateSaved - " + this.m_StartStatusDateSaved);

                               //2019-10-08 AlisherM BZ#50840: prevent duplicate sending event OnRelease: this.userStatus.userReleased will be changed only in "release" action
                               //this.userStatus.userReleased = true;
                               this.agent.m_AgentStatus = AgentStatus.Release;
                               this.agent.m_LastReleaseStateTime = this.agent.m_AgentStateTime;
                               this.displayOnOffreleaseImage();
                               break;
                           case "wrapup":
                               this.CheckClearACDCall();
                               this.userStatus.userWrauped = true;
                               this.SetNewStateTime();
                               this.setAccButton("ReadyId", 1, false);
                               this.HandleCRMEvent("OnWrapUp", EmptyRsponse);
                               break;
                           case "wrap_exit":
                               this.userStatus.userWrauped = false;
                               this.SetNewStateTime();
                               this.setAccButton("ReadyId", 0, false);
                               //2019-10-08 AlisherM BZ#50840: prevent sending OnReady event if agent in logout status
                               if (this.userStatus.userLogin)
                               {
                                   this.HandleCRMEvent("OnReady", EmptyRsponse);
                               }

                               break;
                           //
                           case "rsrv":
                               //var iii = this.callsArray.map(e => e.m_CallState).indexOf(AccCallState.RESERVED);
                               //if (iii != -1) {this.callsArray.splice(iii,1); }
                               var index = this.callsArray.map(e => e.m_CallId).indexOf(response[12]);
                               if (index == -1) {
                                   var oc: OneCall = new OneCall(response[12]);
                                    this.callsArray.push(oc);
                                   index = this.callsArray.map(e => e.m_CallId).indexOf(response[12]);
                                   this.callsArray[index].m_CallState = AccCallState.RESERVED;
                                   this.callsArray[index].m_StartStatusDate = new Date();
                                   this.callsArray[index].m_DeliveredResponse = response;
                               }
                               var cps:any = response[4].split('^');
                               this.prepareCP(cps, this.callsArray[index]);
                               this.agent.m_CallIndex = index;
                               this.updateCallsCount();
                               this.callsArray[index].m_CallState = AccCallState.RESERVED;
                               this.agent.m_AgentStatus = AgentStatus.RESERVED;

                               this.HandleCRMEvent("OnReserved",  this.callsArray[index]);

                               break;
                           //
                           case "otalk":
                               {
                                   this.agent.m_AgentStatus = AgentStatus.OACD;
                                   // var row: OneCall = this.getCurrentRowCallId();
                                   // if (row != null) { row.m_Acd = "OACD"; }
                                   // else { this.agent.m_AgentStatus = AgentStatus.OACD; }
                               }
                               break;
                           //
                           case "talk":
                               //this.agent.m_AgentStatus = AgentStatus.ACD;
                               //this.PrepareAndPutNotification("QueryAgentCalls", "QueryAgentCalls" + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + ",");
                               break;
                           //
                           case "busy":
                               this.agent.m_AgentStatus = AgentStatus.Busy;
                               break;
                           //
                           case "omni":
                               this.agent.m_AgentStatus = AgentStatus.Omni;
                               this.agent.isOmni = true;
                               break;
                           case "ring":
                               this.agent.m_AgentStatus = AgentStatus.Ringing;
                               break;
                       }
                       break;
                   //
                   case "AgentAtStation":
                       this.SetNewStateTime();
                       switch (response[3]) {
                           case "signin":
                               this.SetLoginStatus(true);
                               break;
                           case "signout":
                               this.SetLoginStatus(false);
                                this.agent.m_AgentStatus = AgentStatus.Logout;
                               break;
                       }
                       break;
                   //
                   case "Initiated":
                       index = this.UpdateFromToCallId(response, AccCallState.Inititiated);
                       this.callsArray[index].m_StartStatusDate = new Date();
                       this.agent.m_CallIndex = index;
                       this.updateCallsCount();
                       if (this.agent.m_StartConsultationTo != "" )
                       {
                            this.agent.m_StartConsultation = index;
                       }
                       break;
                   //
                   case "diverted":
                       if (response[7] == this.agent.m_Extension) {

                           index = this.UpdateFromToCallId(response, AccCallState.Inititiated);
                           this.agent.m_CallIndex = index;
                           this.callsArray[index].m_DeliveredResponse = response;
                           this.callsArray[index].m_StartStatusDate = new Date();
                       }
                       else{
                           if (this.agent.m_StartConsultationTo == "" )
                           {
                               index = this.UpdateFromToCallId(response, AccCallState.Cleared);
                           }
                        }
                       break;
                   case "Delivered":
                       // params":"1552199710,1001,Delivered,,37|6200894660895993627^40|4453319^48|No Charge call^50|^55|^,2001,2002,2001,,,-1,-1,2,,N"},
                       if (response[7] == this.agent.m_Extension) {
                           var curidx = this.agent.m_CallIndex;
                           index = this.UpdateFromToCallId(response, AccCallState.Ringing);
                           this.callsArray[index].m_DeliveredResponse = response;
                           //this.agent.m_LastReleaseStateTime = this.agent.m_AgentStateTime;
                           this.callsArray[index].m_AcdGroup = response[3];
                           this.lastCallType = -2;
                           this.lastcallIconMedia = "";
                           this.callsArray[index].m_CallType = Number(response[10]);
                           this.callsArray[index].m_CallCause = Number(response[11]);
                           let callidX =  this.callsArray[index].m_CallId;

                           if (this.agaenLogin.auto == 1) {
                               this.agent.m_AgentStatus = AgentStatus.Ringing;
                               this.autoAnswerTime = new Date();
                               this.autoAnswerTime.setTime(this.autoAnswerTime.getTime() + this.agaenLogin.ringsecs * 1000);
                               this.log("Auto answer, call id: " + callidX + " set ringing to " + this.agaenLogin.ringsecs * 1000);
                           }
                           else {
                               if (this.callsArray.length < 2) {
                                   this.StartRinging(index);
                                   this.agent.m_CallIndex = index;
                               }
                               else {
                                   this.agent.m_CallIndex = curidx;
                                   this.fa_step_forward = this.step_ring;
                                   index = curidx;
                               }
                           }
                       }
                       else {
                           //"params":"1552199511,1001,Delivered,,37|6200894660895993626^48|No Charge call^50|^55|^,2001,2001,2002,,,-1,-1,1,,N"}
                           // Log.Debug("++++++++++ Agent: " + this.agent.m_AgentNo + "    DELEIVERD: to/extstenstion: + " + this.agent.m_To + "/" + this.agent.m_Extension + "  callid: " + this.agent.m_CallId + " state: " + this.agent.m_CallStatus.toString());
                           index = this.UpdateFromToCallId(response, AccCallState.Connected);
                           this.agent.m_CallIndex = index;
                           this.callsArray[index].m_StartStatusDate = new Date();
                           this.callsArray[index].m_DeliveredResponse = response;
                           //2-Aug-2022 YR BZ#56567
                           if(response[6] == this.agent.m_Extension)
                               this.HandleCRMEvent("OnOutgoing", this.callsArray[index]);
                       }
                       //this.agent.m_LastIdleStateTime = null;
                       this.updateCallsCount();
                       break;
                   //
                   case "established":
                       //"params":"1552197371,1001,established,outbound,,2001,2001,2002,2002,,-1,-1,3,,N"},
                       var prevState: AgentStatus = this.agent.m_AgentStatus
                       //this.agent.m_LastReleaseStateTime = null;
                       index = this.UpdateFromToCallId(response, AccCallState.Connected);
                       if (this.callsArray[index].m_DeliveredResponse.length == 0 ) {
                           this.callsArray[index].m_DeliveredResponse = response;
                       }
                       this.lastCallType = -2;
                       this.lastcallIconMedia = "";
                       this.callsArray[index].m_CallType = Number(response[10]);
                       this.callsArray[index].m_CallCause = Number(response[11]);
                       this.agent.m_CallIndex = index;
                       var oc: OneCall = this.callsArray[index];
                       if (prevState == AgentStatus.Ringing ||response[7] == this.agent.m_Extension) {// incomming
                        //1-Nov-2023 YR BZ#57958
                        oc.m_StartStatusDate = new Date();
                        if (oc.m_Acd == "ACD") {
                            this.agent.m_AgentStatus = AgentStatus.ACD;
                           }
                           else if (oc.m_Acd == "OMNI") {
                               this.agent.m_AgentStatus = AgentStatus.Omni;
                           }
                           else if (oc.m_Acd == "OACD") {
                               this.agent.m_AgentStatus = AgentStatus.OACD;
                               this.SetReinstCallBackOnOff(1);
                           }
                           else {
                               this.agent.m_AgentStatus = AgentStatus.Busy;
                           }
                       }
                       else if (prevState != AgentStatus.OACD && prevState != AgentStatus.Omni) {
                           this.agent.m_AgentStatus = AgentStatus.Busy;
                           oc.m_Acd = "N";
                       }
                       if (this.agent.m_StartConsultation == index)
                       {
                           this.setAccButton("ConferenceCompleteId", 1, false);
                           this.agent.m_StartConsultationAnswered = true;
                       }

                       if (this.callsArray[index].m_Acd == "ACD")
                       {
                           this.HandleCRMEvent("OnConnectedACD", this.callsArray[index]);
                       }
                       else
                       {
                           this.HandleCRMEvent("OnConnected", this.callsArray[index]);
                       }
                       this.agent.m_LastIdleStateTime = null;
                       // Log.Debug("++++++++++ Agent: " + this.agent.m_AgentNo + "    ESTABLISHED: to/extstenstion: + " + this.agent.m_To + "/" + this.agent.m_Extension + "  callid: " + this.agent.m_CallId + " state: " + this.agent.m_CallStatus.toString());
                       break;
                   //
                   case "cleared":
                       this.callIconMedia = 'assets/images/CallTypeIcons/no_icon.ico';
                       this.callIconType = 'assets/images/CallTypeIcons/no_icon.ico';
                       this.callIconRecord = 'assets/images/CallTypeIcons/RecordUnactive.svg';
                       if (this.callsArray.length > 0){
                           index = this.UpdateFromToCallId(response, AccCallState.Cleared);
                       }
                       else {
                           index = -1;
                       }
                       if (this.agent.m_isRecording){
                           this.agent.m_isRecording = false;
                           this.setAccButton("recordingOnId", 0, false);
                           this.PrepareAndPutNotification(action, "stoprecording" + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension);
                       }

                       if (index == -1) { break; }
                       this.lastCallType = -2;
                       this.updateCallsCount();
                       this.SetReinstCallBackOnOff(0);


                       break;
                   //
                   case "hold":
                       index = this.GetCallByCallId(response[12]);
                       if (index == -1) {
                           this.log("hold callid not found: " + response[12]);
                           break;
                       }
                       if (this.agent.m_StartConsultationTo != "" && this.agent.m_StartConsultation == index)
                       {
                           this.agent.m_StartConsultationHeld = index;
                       }
                       else  {
                           this.agent.m_CallIndex = index;
                       }

                       this.callsArray[index].m_CallState = AccCallState.Hold;
                       this.log("hold\n        Call Id: " + this.callsArray[index].m_CallId + "\n        from: " + this.callsArray[index].m_From + "\n        To: " + this.callsArray[index].m_To + "\n        " + this.callsArray[index].m_Acd);

                       this.prepareCP(cps, this.callsArray[index]);
                       this.prepareCallStatusGridData();
                       this.HandleCRMEvent("OnHeld", this.callsArray[index]);
                       break;
                   //
                   case "retrieve":
                       index = this.GetCallByCallId(response[12]);
                       this.agent.m_CallIndex = index;
                       if (index == -1) {
                           this.log("hold callid not found: " + response[12]);
                           break;
                       }
                       this.callsArray[index].m_CallState = AccCallState.Connected;
                       this.prepareCP(cps, this.callsArray[index]);
                       this.prepareCallStatusGridData();
                       this.HandleCRMEvent("OnRetrieved", this.callsArray[index]);
                       break;
                   //
                   case "conferencing":
                       index = this.UpdateFromToCallId(response, AccCallState.Conferenced);
                       this.agent.m_CallIndex = index;
                       this.agent.m_CallStatus = AccCallState.Conferenced;
                       this.callsArray[index].m_To1 = response[8];
                       this.HandleCRMEvent("OnConferenced", this.callsArray[index]);
                       var index_sec = this.callsArray.map(e => e.m_CallId).indexOf(response[11]);
                       if (response[11] == response[12]){
                           // conf with irn
                           index_sec =  this.callsArray.map(e => e.m_CallId).indexOf(response[10]);
                       }
                           if (index_sec != -1) // clear call from calls list
                       {
                           //this.callsArray[index].m_CallId = response[12];
                           this.ClearCall(index_sec);
                       }

                       break;
                   //
                   case "conferenced":
                       index = this.UpdateFromToCallId(response, AccCallState.Conferenced);
                       this.agent.m_CallIndex = index;
                       this.agent.m_CallStatus = AccCallState.Conferenced;
                       this.callsArray[index].m_To1 = response[8];
                       this.HandleCRMEvent("OnConferenced", this.callsArray[index]);
                       index = this.callsArray.map(e => e.m_CallId).indexOf(response[10]);
                       if (index != -1 && this.agent.m_StartConsultationHeld == -1) // clear call from calls list
                       {
                           // check if some "Atouch" breakin
                           if (response[10] != response[12]){
                           this.ClearCall(index);
                           }
                       }
                       break;
                   //
                   case "conferencedto":
                       var idxsecondry: number = this.GetCallByCallId(response[11]);
                       this.callsArray[idxsecondry].m_CallId = response[12];
                       this.callsArray[idxsecondry].m_CallState = AccCallState.Conferenced;
                       this.callsArray[idxsecondry].m_To1 = response[8];
                       this.agent.m_CallIndex = idxsecondry;
                       this.callsArray[idxsecondry].m_From = response[6];
                       this.callsArray[idxsecondry].m_To = response[7];
                       this.callsArray[idxsecondry].m_To1 = response[8];
                       this.m_CallState = AccCallState.Conferenced;
                       this.agent.m_CallStatus = AccCallState.Conferenced; //AccCallState.Conferenced
                       var cps: any = response[4].split('^');
                       this.prepareCP(cps, this.callsArray[idxsecondry]);
                       this.prepareCallStatusGridData();
                       this.HandleCRMEvent("OnConferenced", this.callsArray[idxsecondry]);
                       break;
                   //
                   case "transferred":
                       var idxprimary: number = this.GetCallByCallId(response[10]);
                       this.ClearCall(idxprimary);
                       var idxsecondry: number = this.GetCallByCallId(response[11]);
                       this.ClearCall(idxsecondry);
                       this.agent.m_CallStatus = AccCallState.Transferred;
                       break;
                   //
                   case "transferredtome":
                       var idxsecondry: number = this.GetCallByCallId(response[11]);
                       if (idxsecondry != -1) { // transfered by  start/end  transfered
                           this.callsArray[idxsecondry].m_CallId = response[12];
                       }
                       index = this.UpdateFromToCallId(response, AccCallState.TransferredToMe);
                       this.callsArray[index].m_StartStatusDate = new Date();
                       this.agent.m_CallIndex = index;
                       this.updateCallsCount();
                       break;
                   //
                   case "transferreddev":

                       //1530612801,1002,transferredto,,,2002,2001,2002,2003,,-1,-1,2,,N
                        var idxsecondry: number = this.GetCallByCallId(response[10]);
                        if (idxsecondry != -1) { // transfered by  start/end  transfered
                           this.callsArray[idxsecondry].m_CallId = response[12];
                           this.agent.m_CallIndex = idxsecondry;;
                           this.agent.m_CallStatus = AccCallState.Transferred;
                           //this.callsArray[idxsecondry].m_From = response[7];
                           //this.callsArray[idxsecondry].m_To = response[8];
                           this.callsArray[idxsecondry].m_To1 = response[8];
                        }
                       break;
                   //
                   case "signin":
                       this.SetLoginStatus(true);
                       this.displayOnLogonImage(true);

                       break;
                   case "signout":
                       this.SetLoginStatus(false);
                       this.agent.m_AgentStatus = AgentStatus.Logout;
                       this.displayOffLogonImage(false);

                       break;

                   case "agentinfo":
                       {
                           var isPrimary = this.HandleloginPrimaryLogoutGroups(response[13], true);
                           this.userStatus.userReleased = false;
                           if (response[11] == "1") {
                           }
                           //2019-10-08 AlisherM BZ#50840: NOTE: function displayOnLogonImage will not change login status moved to function SetLoginStatus
                           this.SetLoginStatus(true);
                           if (this.isMainPageReady == true) {
                               this.displayOnLogonImage(isPrimary);
                           }

                           if (response[4] == "") { return; }
                           this.log("agentinfo=> " + response[4]);
                           var alldevices: any = response[4].split('~~');
                           for (let i = 0; i < alldevices.length; i++) {
                               var oneDvice: any = alldevices[i];
                               if (oneDvice == "") { continue; }
                               //1433845068,1002,agentcallstatus,2002;1;5;CONNECTED;40|GLOBAL_CID|,,,2002,,,,,-1,-1,0,
                               var col: any = oneDvice.split(';');
                               if (col.Length < 5) continue;
                               var callid: string = col[1];

                               var index: number = this.UpdateFromToCP(col);
                               this.callsArray[index].m_CallType = 1;// CALL_TYPE.ECT_VOICE;
                               if (col[3] == "SILENT_MONITOR") {
                                   this.HandleCRMEvent("OnSilentStarted", this.callsArray[index]);
                               }
                               //var iii: number = cg.dataGridView1.Rows.Add();
                               //    cg.dataGridView1.Rows[iii].Cells["num"].Value = (iii + 1).toString();
                               //    cg.dataGridView1.Rows[iii].Cells["Device"].Value = col[0];
                               //    cg.dataGridView1.Rows[iii].Cells["CallId"].Value = col[1];
                               //    cg.dataGridView1.Rows[iii].Cells["state"].Value = col[3];
                               if (cps.length > 9) {
                                   ///
                                   var cp0: any = cps[0].split('|');
                                   //                           cg.dataGridView1.Rows[iii].Cells["Dnis"].Value = cp0[2];
                                   cp0 = cps[1].split('|');
                                   //                           cg.dataGridView1.Rows[iii].Cells["Ani"].Value = cp0[2];
                                   cp0 = cps[4].split('|');
                                   //                           cg.dataGridView1.Rows[iii].Cells["SDate"].Value = cp0[2];
                                   cp0 = cps[5].split('|');
                                   //                           cg.dataGridView1.Rows[iii].Cells["STime"].Value = cp0[2];
                                   cp0 = cps[9].split('|');
                                   //                           cg.dataGridView1.Rows[iii].Cells["START_Q_TIME"].Value = cp0[2];
                                   cp0 = cps[10].split('|');
                                   //                           cg.dataGridView1.Rows[iii].Cells["Agent"].Value = cp0[2];
                               }

                           }
                           var idx = this.getMostRecentCallIdx();
                           this.setCallStateIcon(this.callsArray[idx]);
                           this.updateCallsCount()


                       }
                       break;
                   //
                   case "__agentsdetails":
                       var splt = response[4].split('|');
                       for (let ji = 0; ji < splt.length; ji++) {
                           var obj = splt[ji].split(';');
                           this.ACC.m_AgentsList.push(new Key_Desc(obj[0], obj[1], obj[0]));
                       }
                       break;
                   //
                   case "__services":
                       this.ACC.m_ServiceList.push(new Key_Desc(id, desc, ""));
                       //this.log("services: " + id + "," + desc);
                       break;
                   //
                   case "__groups":
                       {
                           var grp: Key_Desc = new Key_Desc(id, desc, "0");
                           var index = this.agaenLogin.primary_groups.indexOf(id);
                           if (index != -1) {
                               grp.Id = "1";
                           }
                           this.ACC.m_GroupsList.push(grp);
                       }

                       //this.log("groups: " + id + "," + desc);
                       break;
                   //
                   case "__callprofiles":
                       this.ACC.m_CallProfileLists.push(new Key_Desc(id, desc, ""));
                       //this.log("callprofiles: " + id + "," + desc);
                       break;
                   //
                   case "__releasecodes":
                       this.ACC.m_ReleaseCodesList.push(new Key_Desc(id, desc, ""));
                       if (id != "1" && id != "2" && id != "999") {
                           this.ACC.m_SelectRC.push(new Key_Desc(id, desc, ""));
                       }
                       //this.log("releasecodes: " + id + "," + desc);
                       break;
                   //
                   case "__wrapupcodes":
                       this.ACC.m_WrapUpCodesList.push(new Key_Desc(id, desc, ""));
                       //this.log("wrapupcodes: " + id + "," + desc);
                       break;
                   //
                   case "__phonebook*":
                       this.PartialPhonebook += desc;
                       break;
                   //
                   case "__phonebook":
                       try {

                           var s: string = "";
                           var s1: string = "";
                           s = desc;
                           if (this.PartialPhonebook != "") {
                               s = this.PartialPhonebook + desc;
                               this.PartialPhonebook = "";
                           }

                           //console.log("__phonebook: " + s);
                           s1 = this.b64DecodeUnicode(s);
                           this.phonebook = JSON.parse(s1);
                           console.log("__phonebook: " + s1);

                       } catch (e) {
                           this.ForceLogToServer("__phonebook ERROR: " + e.message + ", len: " + desc.length);
                       }
                       break;
                   //__personalStatistics
                   case "__personalStatistics":
                       {
                           this.LastPersonal = desc;
                           this. LastPersonalDate = new Date().toTimeString().split(' ')[0];
                           if (this.ShowPST)
                           {
                               //this.log("__personalStatistics: " + desc);
                           }

                           this.PSWtot.ACDGroups = [];
                           this.PSWtot.Update(desc,this.ACC.m_GroupsList);
                        }
                    break;
                    //__personalGrpStatistics
                    case "__personalGrpStatistics":
                       {
                           this.LastGrpPersonal = desc;
                           this. LastPersonalGrpDate = new Date().toTimeString().split(' ')[0];
                           if (this.ShowPST)
                           {
                               //this.log("__personalGrpStatistics: " + desc);
                           }
                           this.PSWQtot.ACDQGroups = [];
                           this.PSWQtot.Update(desc,this.ACC.m_GroupsList);
                           this.accagentPage.showDetailedQChartsACDbyGroups();
                         }
                    break;
                   //
                   case "_endautosend":
                       this.waitForLogin = false;
                       this.HandleCRMEvent("OnLogon", EmptyRsponse);
                       //this.accagentPage.prepTitle();
                       break;
                   //
                   case "__etasini*":
                       this.PartialEtasini += desc;
                       break;
                   //
                   case "__etasini":
                       try {

                           var s: string = "";
                           var s1: string = "";
                           s = desc;
                           if (this.PartialEtasini != "") {
                               s = this.PartialEtasini + desc;
                               this.PartialEtasini = "";
                           }
                           //s = this.PartialEtasini + desc;
                           //this.PartialEtasini = "";
                           //console.log("__etasini: " + s);
                           s1 = this.b64DecodeUnicode(s);
                           this.etasIni = JSON.parse(s1);
                           if (this.etasIni.IsLogWebAgent == undefined) { this.etasIni.IsLogWebAgent = false; }
                           this.agentButtons = this.etasIni.ToolBar.Buttons;
                           this.savedNumbers = this.etasIni.SAVED_NUMBERS;
                           this.CP = this.etasIni.CallsStatus.Columns;
                           this.QCP = this.etasIni.ACDCalls.Columns;
                           this.LogCP = this.etasIni.CallsLog.Columns;
                           this.prepareCallStatHeader();
                           this.prepareCallStatusGridData();
                           this.prepareCallLogsHeader();
                           this.prepareCallLogGridData();
                           this.prepareCallQHeader();
                           this.prepareCallQGridData();
                           this.prepareTelephony(this.etasIni.Telephony!);


                           // check states of accagentPage
                           if (this.accagentPage != null) {
                               this.accagentPage.prepTitle();
                               this.getAACStatus();
                               if (this.accagentPage.tiles == null) {

                                   this.accagentPage.PrepareAgentPage();
                               }
                               else {
                                   this.setTiles(null);
                               }
                           }

                           let op1 = function op1(sID: any): OperatorFunction<any, any> {
                               AppConfig.sessionId = sID;
                               console.log("this.sessionId: " + sID);
                               return this;
                           }

                            //of(console.log("this.sessionId: " + this.sessionId)).pipe(op1(this.sessionId));
                            console.log("this.sessionId: " + this.sessionId)

                            AppConfig.sessionId = this.sessionId;
                            console.log(" AppConfig.sessionId: " +  AppConfig.sessionId);
                            this.tokenService.saveSessionId(this.sessionId);
                           const navigationExtras: NavigationExtras = {
                               state: {
                                   transd: this.sessionId,
                                   workQueue: false,
                                   services: 10,
                                   code: '003'
                               }
                           };


                            this.router.navigateByUrl('/AccAgentPage' + this.savedURLSearch, navigationExtras);

                            //2019-05-05 AlisherM BZ#49794: disable click2dial on logon
                           if (this.isSalesforce) {
                               this.salesforce.disableClickToDial();
                           }
                       } catch (e) {
                           this.ForceLogToServer("__etasini ERROR: " + e.message + ", len: " + desc.length);
                       }
                       break;
                   //2019-09-24 AlisherM BZ#50840: receive CRM.json and convert it back from base64 format
                   case "__crmjson*":
                       this.PartialCRM += desc;
                       break;
                   //
                   case "__crmjson":
                       try {
                           var s: string = "";
                           var s1: string = "";
                           s = this.PartialCRM + desc;
                           this.PartialCRM = "";

                           //console.log("__crmjson: " + s);
                           s1 = this.b64DecodeUnicode(s);
                           this.CRM = JSON.parse(s1);
                           if (this.CRM.CPFDelimeter != null)
                           {
                               this.CPFDelimeter = this.CRM.CPFDelimeter;
                           }
                       } catch (e) {
                           this.ForceLogToServer("__crmjson ERROR: " + e.message + ", len: " + desc.length);
                       }
                       break;
                   //
                   case "GroupQueueCPInfo":
                       try {
                           var grp_id: string = response[5];
                           this.log("GroupQueueCPInfo group: " + grp_id  + " calls:"  + response[4]);
                           this.CleanCallsInQueueByGroupNo(grp_id);
                           var calles: any = response[4].split('^'); // seperate to calls
                           for (let i = 0; i < calles.length; i++) {
                               if (calles[i] == "") return;
                               var cps: any = calles[i].split(';');   //seperate to cp fields less first one which is group number
                               var callId: string = cps[0];
                                var idxx = this.ACC.m_GroupsList.map(e => e.Key).indexOf(grp_id);
                               if (idxx != -1) {
                                   grp_id = this.ACC.m_GroupsList[idxx].Desc;
                               }
                               cps[0] = CP_CODES.GROUP_ID.toString() + '|' + grp_id;
                               //cps.splice(0, 1);
                               console.log("GroupQueueCPInfo update by gruopid: " + response[5]);
                               var OQC: OneQueuedCall = new OneQueuedCall(callId, response[5], cps);
                               this.QueuedCalls.push(OQC);
                           }
                           this.prepareCallQGridData();
                       } catch (e) {

                       }
                       break;
                   case "UpdateCP":
                       {
                           var iii = this.callsArray.map(e => e.m_CallId).indexOf(response[12]);
                           if (iii != -1) {
                               let ocXX:OneCall =  this.callsArray[iii];
                               let cps = response[4].split('^');
                               this.prepareCP(cps,ocXX);
                               this.prepareCallStatusGridData();
                            }
                        }
                       break;
                   case 'agentLoginsList':
                       let lll: string = this.b64DecodeUnicode(response[4]);
                       this.setAccButton("transferToAgentNoId", 0, false);
                       if (lll.length < 10) { break; }
                       this.agentsReadyList = JSON.parse(lll);

                       //let idx: number = -1;//this.agentsReadyList.map(e => e.ext).indexOf(this.agent.m_Extension);
                       for (let idx = 0;idx < this.agentsReadyList.length;++idx){
                           if (this.agentsReadyList[idx].ext == this.agent.m_Extension){
                               this.agentsReadyList.splice(idx, 1);
                           }
                       }
                       if (this.agentsReadyList.length > 0) {
                           this.setAccButton("transferToAgentNoId", 1, false,'','transferToAgent');
                           break;
                       }
                       break;
                   //
                   case 'callomnimessage':
                       let message = response[5];
                       this.accagentPage.receiveChatMes(message);
                       break;
                   //
                   default:
                       this.log("HandleNotifications=> Unknown action: " + action);
                       break;
               }// end switch
           } catch (e) {
               this.ForceLogToServer(e.toString());

           }
           //response = [];
       }
       //

       public HandleNotifications(notificationList: AccNotifications[])// string agentNo,int checkInterval,int checkCount, AgentStatus CheckedAgentStatus, AgentStatus CheckedCallStatus, out Agent A,out string err)
       {
           for (let i = 0; i < notificationList.length; i++) {
               this.HandleNotification(notificationList[i]);
               //response = [];
           }
           notificationList = [];
       }
       //
       public audioObj = null;
       //============================[CheckRinging]=============================
       CheckRinging() {
           // ask if need to play ring sound
           if (this.etasIni.AgentSetup[2].setup[0].selected == false) {
               return;
           }
           // need to make noise
           this.audioObj = document.createElement('audio');
           // set ring once or Continuous Ring
           var continuous = this.etasIni.AgentSetup[3].setup[1].selected;
           if (typeof this.audioObj.loop == 'boolean') {
               this.audioObj.loop = continuous;
           }
           var wavFlie: string = 'assets/audio/Ding.wav'; // default beep
           // check other wav file
           if (this.etasIni.AgentSetup[4].setup[1].selected == true) {
               wavFlie = 'assets/audio/' + this.etasIni.AgentSetup[4].setup[1].data;
           }
           this.audioObj.src = wavFlie;
           this.audioObj.play();


       }
       //============================[CheckPauseAudio]=============================
       CheckPauseAudio() {
           if (this.audioObj != null) {
               this.audioObj.pause();
           }
           this.audioObj = null;
       }

       //============================[CleanCallsInQueueByGroupNo]=============================
       CleanCallsInQueueByGroupNo(groupNo: string) {
           var count: number = 0;
           var start: number = -1;
           for (let i = 0; i < this.QueuedCalls.length; i++) {
               var q: OneQueuedCall = this.QueuedCalls[i];
               if (q.m_Group_No == groupNo) {
                   if (start == -1) {
                       start = i;
                   }
                   count++;
               }
               else // diff group number
               {
                   if (start != -1) {
                       break; // allsame group ais contigous
                   }
               }

           }
           if (count > 0) {
               this.QueuedCalls.splice(start, count);
           }
       }
       //============================[resolveAfter1Second]===================================
       resolveAfter1Second(interval: number) {
           this.log("starting fast promise");
           return new Promise(resolve => {
               setTimeout(function () {
                   resolve(10);
                   this.log("fast promise is done");
               }, 1000);
           });
       }
       //======================[prepare grids tabs] ==================
       //======================[] ====================================
       //======================[buildWinTab] ========================
       public OPENCALL: boolean = true;
       FullWinTabContent = ['OpenCalls', 'CallsLog', 'AcdQCalls', 'Telephony', 'Setup'];
       public WinTabContent = ['open-calls></open-calls>'];
       FullWinTabs = ['Open Calls Status', 'Calls log', 'ACD Calls in Queue', 'Telephony window', 'Setup'];
       public WinTabs: oneTab[] = [];
       public winDisableCount = 0;

       public enableCallStatusWin: boolean = true;
       public enableCallLogWin: boolean = true;
       public enableCallQWin: boolean = true;
       public enableTelephonyWin: boolean = true;
       public enableSetupWin: boolean = true;
       public enablePhonebookWin: boolean = true;



       buildWinTab() {
           this.WinTabs = [];
           this.enableCallStatusWin = this.agent.m_COS[COS.WIN_CALL_STATUS];
           this.enableCallLogWin = this.agent.m_COS[COS.DISP_WIN_CALLS_LOG];
           this.enableCallQWin = this.agent.m_COS[COS.DISP_WIN_ACD_CALL];
           this.enableTelephonyWin = this.agent.m_COS[COS.DISP_WIN_TELEPHONY];
           this.enableSetupWin = this.agent.m_COS[COS.DISP_WIN_SETUP];
       }
       // =======================[setEmtyButton]==[setup]==============================
       setEmtyButton() {
           var idx = 1;
           if (this.agent.m_COS[COS.DISP_WIN_SETUP] == true) {
               idx = 0;
           }
           this.setAccButton("EmptyId", idx, false);
           //
           idx = 2;
           if (this.agent.m_COS[COS.SPECIFIC_LOGIN] == true) {
               idx = 0;
           }
           //this.setAccButton("loginGroupId", idx, false);
           this.setAccButton("manageloginGroupsId", idx, false);
       }
       //=======================[SetReinstCallBackOnOff]==============================
       SetReinstCallBackOnOff(idx:number){
           this.setAccButton("CallbackReinsertBusyId", idx, false);
           this.setAccButton("CallbackReinsertNoAnswerId", idx, false);
           this.setAccButton("CallbackReinsertTerminateId", idx, false);
        }
       // =======================[setAccButton]========================================
       // general function params: buttonid: id of the button in the html,index of predefined button array
       setAccButton(id: string, idx: number, justSetimage: boolean,classX?:string, classY?:string) {
           try {
               let index = AccButtons.map(e => e.id).indexOf(id.split('.')[0]);
               let button: AccOneButton2 = AccButtons[index];

               //let tilesbuttons = this.tiles.filter(x => x.id.includes(id.split('.')[0]));
               let tilesbuttons = this.tiles.filter(x => x.id.includes(id));
               for (let i = 0; i < tilesbuttons.length; ++i) {
                    let tile: accbutton = tilesbuttons[i];
                    tile.isdisable = false;
                   if (justSetimage == false) {
                       tile.color = button.Array[idx].color;
                       tile.class = button.Array[idx].class;
                       if (classX){tile.class += " " + classX};
                   }
                   tile.titlesrc = button.Array[idx].title;
                   var bt; var sbt = this.trnslt.get(tile.titlesrc).subscribe((text: string) => { bt = text });
                   if (tile.isSet != true) {
                       tile.title = bt;
                   }
                   else {
                       tile.title = bt + "\n" + tile.title.split("\n")[1];
                       if (classY){tile.class += " " + classY};
                   }
                   tile.img = button.Array[idx].img;
                   if (button.Array[idx].isdisable != undefined)
                   {
                       tile.isdisable = button.Array[idx].isdisable;
                   }
                   //this.tiles[index] = tile;
               }
           } catch (e) {
               this.ForceLogToServer("setAccButton exeption (" + id + " idx: " + idx.toString() + ") " + e.message)

           }
       }
       // ===================[displayOnOffLogongroupImage]================================
       displayOnOffLogongroupImage() {
           var a = document.getElementById("loginGroupId");
           if (this.userStatus.userLogin == false)
               a.innerHTML = ' <img  src="assets/images/acc/acd_logout_group.png" title="Logout group" class="rounded">';
           else
               a.innerHTML = " <img  src='assets/images/acc/acd_login_group.png' title='Logon group' class='rounded'>";

           this.log("logongroupChanged to " + this.userStatus.userLogin);
       }

       //2019-10-08 AlisherM BZ#50840: check previous login status to prevent duplicate OnLoggedIn event
       SetLoginStatus(login_status: boolean)
       {
           var previous_login_status: boolean = this.userStatus.userLogin;
           this.userStatus.userLogin = login_status;
           this.agent.m_isLogon = login_status;

           if (previous_login_status == false && login_status == true)
           {
               this.HandleCRMEvent("OnLoggedIn", EmptyRsponse);

               //2019-05-05 AlisherM BZ#49794: enable click2dial on login
               if (this.isSalesforce) {
                   this.salesforce.enableClickToDial();
               }
           }
           else if (previous_login_status == true && login_status == false)
           {
               this.HandleCRMEvent("OnLoggedOut", EmptyRsponse);

               //2019-05-05 AlisherM BZ#49794: disable click2dial on logout
               if (this.isSalesforce) {
                   this.salesforce.disableClickToDial();
               }
           }
       } //end of SetLoginStatus

       // =====================[displayOnLogonImage]====================================
       displayOnLogonImage(isPrimary: boolean) {
           var setLogin: boolean = true;
           var countPrimaryLogin: number = 0;
           var countPrimary: number = 0;
           // get all programmed login group bottums
           //let groupButtons = this.tiles.filter(x => x.id.includes("loginGroupId"));

           for (let i = 0; i < this.ACC.m_GroupsList.length; i++) {
               if (this.ACC.m_GroupsList[i].More == "1") {
                   countPrimary++;
               }
               if (this.ACC.m_GroupsList[i].Flag == true) {
                   if (this.ACC.m_GroupsList[i].More == "1") {
                       //count primary groups
                       countPrimaryLogin++;
                   }
                   var id = "loginGroupId." + this.ACC.m_GroupsList[i].Key;
                   var groupidx: number = this.tiles.map(x => x.id).indexOf(id);
                   if (groupidx != -1) {
                       this.setAccButton(id, 1, false);
                   }
               }
           }
           if (isPrimary == true) {
               //2019-10-008 AlisherM BZ#50840: moved to function SetLoginStatus
               // this.agent.m_isLogon = true;
               // this.userStatus.userLogin = true;
               this.setAccButton("loginPrimaryId", 1, true);
               //this.log("login Primary: " + this.userStatus.userLogin);
           }
       }
       // =====================[displayOffLogonImage]====================================
       displayOffLogonImage(isPrimary: boolean) {

           var setLogin: boolean = true;
           var countPrimaryLogin: number = 0;
           var countLogin = 0;
           var countPrimary: number = 0;
           // get all programmed login group bottums
           //let groupButtons = this.tiles.filter(x => x.id.includes("loginGroupId"));

           for (let i = 0; i < this.ACC.m_GroupsList.length; i++) {
               if (this.ACC.m_GroupsList[i].More == "1") {
                   countPrimary++;
               }
               if (this.ACC.m_GroupsList[i].Flag == false) {

                   if (this.ACC.m_GroupsList[i].More == "1") {
                       //count primary groups
                       countPrimaryLogin++;
                       this.ACC.m_GroupsList[i].More = "0";
                   }
                   var id = "loginGroupId." + this.ACC.m_GroupsList[i].Key;
                   var groupidx: number = this.tiles.map(x => x.id).indexOf(id);
                   if (groupidx != -1) {
                       this.setAccButton(id, 0, false,"group");
                   }
               }
               else { // count all logined groups
                   countLogin++;
               }
           }
           //if (countPrimary == countPrimaryLogin) {
            if (countLogin == 0) {
               //2019-10-008 AlisherM BZ#50840: moved to function SetLoginStatus
               // this.agent.m_isLogon = false;
               // this.userStatus.userLogin = false;
               this.SetLoginStatus(false);
               this.setAccButton("loginPrimaryId", 0, true);
               this.log("logout Primary: " + this.userStatus.userLogin);
           }
       }
       //------------------------------------------------------------------
       focusOutFunction() {

       }

       // =============================[prepareMat_Select]=====================
       prepareMat_Select(list: Key_Desc[]) {

       }
       // =====================================================================
       // displayReleaseWithIcode()
       // {
       //     var a = document.getElementById("releaseId");
       //     if (this.userStatus.userReleased == false)
       //       a.innerHTML = ' <img  src="assets/images/acc/acd_resume.png" title="Resume"" class="rounded">';
       //     else
       //         a.innerHTML = " <img  src='assets/images/acc/acd_release.png' title='Release' class='rounded'>";
       // }

       // ===============================[displayOnOffreleaseImage]===========================
       displayOnOffreleaseImage() {
           let idx = 0;
           if (this.userStatus.userReleased == false) {
               idx = 1;
           }
           this.setAccButton("releaseId", idx, false);
       }
       // =========================[wrapUpChanged]============================================
       wrapUpChanged() {
           if (this.userStatus.userWrauped == true) this.userStatus.userWrauped = false;
           else this.userStatus.userWrauped = true;
           this.displayOnOffWrapUpImage();
       }
       displayOnOffWrapUpImage() {
           let idx = 1;
           if (this.userStatus.userWrauped == false) {
               idx = 0;
           }
           this.setAccButton("loginPrimaryId", idx, false);
       }
       // =========================[wrapUpOffState]==========================
       wrapUpOffState() {
           if (this.userStatus.userWrauped == true) this.userStatus.userWrauped = false;
           else this.userStatus.userWrauped = true;
           this.displayWrapUpOffState();
       }
       // =========================[displayWrapUpOffState]===================
       displayWrapUpOffState() {

       }
      // ============================[getAllLists]==========================================
       PartialPhonebook: string = "";
       PartialEtasini: string = "";
       PartialCRM: string = "";
       getAllLists() {
           this.offAllSpecialForms();
           this.ACC.m_AgentsList = [];
           this.ACC.m_ServiceList = [];
           this.ACC.m_GroupsList = [];
           this.ACC.m_CallProfileLists = [];
           this.ACC.m_ReleaseCodesList = [];
           this.ACC.m_SelectRC = [];
           this.PartialPhonebook = "";
           this.PartialEtasini = "";
           this.ACC.m_WrapUpCodesList = [];
           this.etasIni = null; this.agentButtons = null; this.savedNumbers = null;
           //this.PrepareAndPutNotification("getallagentsdetails", "getallagentsdetails" + ",000," + this.agent.m_AgentNo + ", ,");
           //this.PrepareAndPutNotification("getservices", "getservices" + ",000," + this.agent.m_AgentNo + ", ,");
           //this.PrepareAndPutNotification("getgroups", "getgroups" + ",000," + this.agent.m_AgentNo + ", ,");
           //this.PrepareAndPutNotification("getcallprofiles", "getcallprofiles" + ",000," + this.agent.m_AgentNo + ", ,");
           //this.PrepareAndPutNotification("getwrapupcodes", "getwrapupcodes" + ",000," + this.agent.m_AgentNo + ", ,");
           //this.PrepareAndPutNotification("getreleasecodes", "getreleasecodes" + ",000," + this.agent.m_AgentNo + ", ,");
           //this.PrepareAndPutNotification("getetas", "getetas" + ",000," + this.agent.m_AgentNo + ", ,");
       }
       // ========================[setMainStatus]============================
       public CurrentAgentStatus: string = "DontCare";
       public DiffTimeState: string = "00:00:00";
       public LastDidpslayedStatus: AgentStatus = AgentStatus.DontCare;
       //---------------------------------------------------------------------
       setMainStatus(toStatus, ts, moretext) {
           if (this.NoConnectionToAcc == true) {
               return;
           }
           if (this.LastDidpslayedStatus != toStatus || moretext.length > 4)
           {
               this.LastDidpslayedStatus = toStatus;
               this.CurrentAgentStatus = AgentStatusTxt[toStatus] + moretext;
               this.log("setMainStatus <" + toStatus + "-" + ts + ">");
           }
           //this.log("setMainStatus <" + toStatus + "-" + ts + ">");
           try {
               this.accagentPage.statusBoard.updateTimer(ts);
           } catch (ignore) {}

           //this.DiffTimeState = ts;
       }
       pad2(number) {
           return (number < 10 ? '0' : '') + number
       }

       //===========================[setCallStateIcon]===================================
       lastCallType: number = -10;
       setCallStateIcon(call: OneCall) {
           if (this.lastCallType == call.m_CallType) { return; }
           this.lastCallType = call.m_CallType;
           this.callIconMedia = "assets/images/CallTypeIcons/media_voice.ico"
           this.callIconType = 'assets/images/CallTypeIcons/no_icon.ico';
           this.callIconRecord = 'assets/images/CallTypeIcons/Record'+
               (this.agent.m_isRecording?'On':'Unactive')+'.svg';
           //this.log("setCallStateIcon=> calltype: " + this.lastCallType.toString());
           switch (this.lastCallType) {
               case CALL_TYPE.ECT_VOICE:
                   if (call.m_Acd == "ACD") { this.callIconType = 'assets/images/CallTypeIcons/incoming_acd.ico'; }
                   if (call.m_Acd == "OMNI") { this.callIconType = 'assets/images/CallTypeIcons/media_chat.ico'; }
                   if (call.m_Acd == "OACD") {
                        this.callIconType = 'assets/images/CallTypeIcons/outbound_callback.ico';
                       }
                   break;
               //
               case CALL_TYPE.ECT_ABANDONED:
                   this.callIconType = 'assets/images/CallTypeIcons/outbound_abandon.ico';
                   break;
               //
               case CALL_TYPE.ECT_CALLBACK:
                   this.callIconType = 'assets/images/CallTypeIcons/outbound_callback.ico';
                   break;
               //
               case CALL_TYPE.ECT_CALL_FROM_CLICK_TO_DIAL_LIST:
               case CALL_TYPE.ECT_CALL_FROM_CAMPAIGN_LIST:
                   this.callIconType = 'assets/images/CallTypeIcons/outbound_diallist.ico';
                   break;
               //
               case CALL_TYPE.ECT_CALL_CHAT:
                   break;
               default:
                   this.callIconType = 'assets/images/CallTypeIcons/no_icon.ico';
                   break;
           }
       }
       //===========================[SetAgentStatus]=====================================
       lastcallIconMedia: string = "";
       SetAgentStatus()
       {
           var moretext: string = ""
           var callid = this.getCurrentCallId();
           var call: OneCall = null
           var index = this.callsArray.map(e => e.m_CallId).indexOf(callid);
           if (index == -1)
           {
               if (this.callIconMedia != this.lastcallIconMedia)
               {
                   this.callIconMedia = 'assets/images/CallTypeIcons/no_icon.ico';
                   this.callIconType = 'assets/images/CallTypeIcons/no_icon.ico';
                   this.callIconRecord = 'assets/images/CallTypeIcons/RecordUnactive.svg';
                   this.lastcallIconMedia = this.callIconMedia;
               }
               this.curentCall = '';
               if (this.accagentPage != null && index == -1){
                   this.accagentPage.SetCurrentCP([]);
               }
               var ts = Math.floor((Date.now() - this.agent.m_AgentStateTime) / 1000);
               //this.log("SetAgentStatus (index == -1) ts<" + ts + ">");
               if (this.userStatus.userLogin == false) {
                   this.agent.m_AgentStatus = AgentStatus.Logout;
               }
               else if (this.userStatus.userWrauped == true)
               {
                   this.agent.m_AgentStatus = AgentStatus.WrapUp;
                   if (this.agent.WrapUpCode != "1" && this.agent.WrapUpCode != "01")
                   {
                       var i = this.ACC.m_WrapUpCodesList.map(e => e.Key).indexOf(this.agent.WrapUpCode);
                       if (i != -1)
                           moretext = " - " + this.ACC.m_WrapUpCodesList[i].Desc;
                   }
               }
               else if (this.userStatus.userReleased == true)
               {
                   if (this.agent.ReleaseCode == "2")
                   {
                       this.agent.m_AgentStatus = AgentStatus.ForceRelease;
                       //moretext = "Force Release" ;
                   }
                   else
                   {
                       this.agent.m_AgentStatus = AgentStatus.Release;
                       if (this.agent.ReleaseCode != "1" && this.agent.ReleaseCode != "01")
                       {
                           var i = this.ACC.m_ReleaseCodesList.map(e => e.Key).indexOf(this.agent.ReleaseCode);
                           if (i != -1)
                               moretext = "\n" + this.ACC.m_ReleaseCodesList[i].Desc;
                       }
                   }
                   this.PSWtot.releaseTime = this.PSWtot.makeTime((ts + this.PSWtot.releaseTimeNo).toString());
                   this.PSWtot.loginTime = this.PSWtot.makeTime((ts + this.PSWtot.loginTimeNo).toString());
               }
               else if (this.agent.isOmni)
               {
                   this.agent.m_AgentStatus = AgentStatus.Omni;
               }
               else if(this.agent.m_AgentStatus == AgentStatus.RESERVED ||
                       this.agent.m_AgentStatus == AgentStatus.SemiBusy ||
                       this.agent.m_AgentStatus == AgentStatus.OACD)
               {
                   this.agent.m_AgentStatus = this.agent.m_AgentStatus;
               }
               else
               {
                   this.agent.m_AgentStatus = AgentStatus.Idle;
                   if (this.ShowPST == true){
                       this.sendStatisticsRequest();
                   }
                   //this.agent.m_LastIdleStateTime = new Date();
               }
               var s = this.agent.m_AgentStatus;
           }
           else
           {
               this.UpdateAgentStatus(index);
               call = this.callsArray[index];
               ts = Math.floor((new Date().getTime() - call.m_StartStatusDate.getTime()) / 1000);
               //this.log("SetAgentStatus ts<" + ts + ">");
               //s = AccCallState[call.m_CallState];
               s = this.agent.m_AgentStatus;

               if (call.m_From != this.agent.m_Extension) {
                   this.curentCall = "From: " + call.m_From ; // From:
               }
               else {
                   this.curentCall = "To: " + call.m_To;      // To:
               }
               if(call.m_whisper != "") {
                   //this.curentCall += '<br>';
                   this.curentCall += " - Whisper: ";
                   this.curentCall += call.m_whisper;
               }
               this.setCallStateIcon(call);
               if (this.accagentPage != null)
               {
                   var idx = this.callsArray[index].m_CP.map(e => e.Id).indexOf(CP_EXT.IDX_CALLS_STAT_CALL_ELAPSED_TIME.toString());
                   if (idx != -1)
                   {
                       var elapepes = this.CalcElapessedTime(this.callsArray[index].m_StartStatusDate, new Date());
                       this.callsArray[index].m_CP[idx].Desc = elapepes;
                   }
                   this.accagentPage.SetCurrentCP(this.callsArray[index].m_CP);
               }
           }

           var h = Math.floor(ts / 3600);
           var m = Math.floor(((ts / 60) % 60));
           var sec = Math.floor(ts % 60);
           var status = '' + this.pad2(h) + ":" + this.pad2(m) + ":" + this.pad2(sec);
           //
           this.setMainStatus(s, status, moretext);
           //
           if (index != -1)
           {
               status = " CallId: " + callid + " From: " + call.m_From + " To: " + call.m_To;
               if (call.m_CallState == AccCallState.Conferenced) {
                   status += ", " + call.m_To1;
               }
           }
           else {
               status = (this.agent.m_isLogon == false ? "logout " : "") + s;
           }

           this.CurrStatus = status;
           var node = document.getElementById("statusId");
           if (node == null) {
               return;
           }
           // var node  = document.getElementsByClassName("accLogId");
           var textContent = node.textContent;
           node.textContent = this.CurrStatus;
           //this.log(this.CurrStatus);
       }

    //
    //=================[saveAeonixAppCenterParams]==============
    saveAeonixAppCenterDetails(details?: string) {
        if (details != undefined) {
            try {
                var pp = atob(details);
                let user = JSON.parse(pp);
                this.tokenService.saveToken(user.accessToken);
                this.tokenService.saveRefreshToken(user.refreshToken);
                this.tokenService.saveUser(user);
            } catch(e) {
                console.error("Failed to restore token details ==> " + ", " + e.message);
                return;
            }
        }
    }
    //=================[saveCredintial]==========================
    saveCredintial(p?: string) {
        var t: any = new Date().getTime().toString();
        localStorage.setItem("SaveTimestamp",t);
        if (p != undefined)
        {
            try{
            //agent.m_AgentNo + ',' + this.agent.m_Extension + ',' + this.agent.m_Password + ',' + (this.agent.m_isLogon == true) ? 'true' : 'false' + (this.userStatus.userReleased == true) ? 'true' : 'false',sessionid;
            var pp = atob(p).split(',');
            console.log("After assign to new TOMACT url, agent No: " +  pp[0]);
            localStorage.setItem("AccWebAgentNo", pp[0]);
            localStorage.setItem("AccWebAgentExt", pp[1]);
            localStorage.setItem("AccWebAgentReload", btoa(pp[2]));
            localStorage.setItem("AccWebAgentlogin", pp[3]);
            localStorage.setItem("AccWebAgentRelease",pp[4]);
            localStorage.setItem("AccWebStartStateDate",pp[5]);
            if (pp.length >= 8){
                localStorage.setItem("AccWebAgentLagnguage",pp[6]);
                localStorage.setItem("AccWebAgentSessionId",pp[7]);
                this.savedURLSearch = pp[8];
            }

        }catch(e){ console.error("saveCredintial==> " + p + ", " + e.message);}
            return;
        }
        //localStorage.setItem("SavedUrlSearch", this.savedURLSearch);
        if (this.agent != null) {
            localStorage.setItem("AccWebAgentNo", this.agent.m_AgentNo);
            localStorage.setItem("AccWebAgentExt", this.agent.m_Extension);
            localStorage.setItem("AccWebAgentReload", btoa(this.agent.m_Password));
            localStorage.setItem("AccWebAgentlogin", this.agent.m_isLogon == true ? 'true' : 'false');
            localStorage.setItem("AccWebAgentRelease",this.userStatus.userReleased == true ? 'true' : 'false');
            localStorage.setItem("AccWebStartStateDate",this.agent.m_AgentStateTime.toString());
            localStorage.setItem("AccWebAgentSessionId",this.sessionId);
            //console.log("AccWebStartStateDate: " + localStorage.getItem("AccWebStartStateDate"));
        }
    }
    //=================[LoadCredintial]==========================
    LoadCredintial() {
        var t = localStorage.getItem("SaveTimestamp");
        if (t != undefined)
        {
            var ts:number = Number(t);
            var ct = new Date().getTime() - 90000 - ts; // 30 secs
            if (ct > 0)
            {
                this.ClearCredintial();
                return false;
            }
        }
         var an = localStorage.getItem("AccWebAgentNo");
        if (an != undefined && an != "") { 
 
            var ae = localStorage.getItem("AccWebAgentExt");
            var ap = atob(localStorage.getItem("AccWebAgentReload"));
            this.m_isLogonSaved = (localStorage.getItem("AccWebAgentlogin") == 'true') ? true : false;
            this.userStatus.userReleased =  (localStorage.getItem("AccWebAgentRelease") == 'true') ? true : false;
            this.agaenLogin = new LoginUser(an, ap, ae);
            this.sessionId = localStorage.getItem("AccWebAgentSessionId");
            this.agaenLogin.auto = 0;
            //this.log("LoadCredintial=> " + ap);
            var a = localStorage.getItem("AccWebStartStateDate");
            this.m_StartStatusDateSaved = null;
            if (a != undefined)
            {
                this.m_StartStatusDateSaved = new Date().setTime(Number(a));
            }
        }
        this.ClearCredintial();
        return true;
    }
    //=================[ClearCredintial]==========================
    ClearCredintial() {
         localStorage.removeItem("SaveTimestamp");
        localStorage.removeItem("AccWebAgentNo");
        localStorage.removeItem("AccWebAgentExt");
        localStorage.removeItem("AccWebAgentReload");
        localStorage.removeItem("AccWebAgentlogin");
        localStorage.removeItem("AccWebAgentRelease");
        localStorage.removeItem("AccWebStartStateDate");
        localStorage.removeItem("AccWebAgentSessionId");
     }

    //=================[changeLanguage]==========================
    changeLanguage(language: string): void {
        localStorage.setItem("AccWebAgentLagnguage", language);
        if (language == 'iw') {
            this.htmlDir = "rtl";
        }
        else {
            this.htmlDir = "ltr";
        }
        this.currentLang = language;
        this.trnslt.use(language).subscribe(() => {
         });
    }
    //=================[saveEtatIniButtons]======================
    saveEtasIniButtons(tiles: any) {
        this.etasIni.ToolBar.Buttons = [];
        this.agentButtons = [];
        for (let i = 0; i < tiles.length; i++) {
            var img = tiles[i];
            var b: accButtonInIni = new accButtonInIni(img.code, "");
            if (img.isSet == true) {
                b.data = img.data;
            }
            this.etasIni.ToolBar.Buttons.push(b);
        }
        this.agentButtons = this.etasIni.ToolBar.Buttons;
        this.saveEtasIni();

    }

    //=================[saveEtasTelActions]======================
    saveEtasTelActions() {
        this.etasIni.Telephony.actions = [];
        this.telActionINIList = [];
        for (let i = 0; i < this.TelephonyActions.length; i++) {
            if (this.TelephonyActions[i].code == "") continue;
            var b: TelActionIni = new TelActionIni(i.toString(), this.TelephonyActions[i].titlesrc, this.TelephonyActions[i].code, this.TelephonyActions[i].data);
            this.etasIni.Telephony.actions.push(b);
        }
        this.agentButtons = this.etasIni.Telephony.actions;
        this.saveEtasIni();

    }
    //=================[getEtasIni]===============================
    public getEtasIni() {
        return this.etasIni;
    }
    //=================[saveEtasIni]===============================
    public saveEtasIni() {
        if (this.etasIni == undefined || this.etasIni == null){ console.log("try to save NULL etas");}
        var etasiniStr: string = "";
        etasiniStr = JSON.stringify(this.etasIni, null, 4);
        var etasEncodedb64: string = this.b64EncodeUnicode(etasiniStr);
        var action: string = "saveetasini";
        this.saveBigDataToAcc(action, etasEncodedb64);
    }
    //=================[SavePhonebook]==========================
    SavePhonebook() {
        var phonebookStr: string = "";
        phonebookStr = JSON.stringify(this.phonebook);
        var phonebookEncodedb64: string = this.b64EncodeUnicode(phonebookStr);
        var action: string = "savephonebook";
        this.saveBigDataToAcc(action, phonebookEncodedb64);
    }
    // =========================== [ saveBigDataToAcc ] ========================================
    saveBigDataToAcc(action: string, bigdata: string) {
        var actionpart: string = action + "*";
        var count: number = Math.floor(bigdata.length / 29000);
        var i = 0;
        for (i = 0; i < count; ++i) {
            var s: string = bigdata.substr(i * 29000, 29000);
            this.log("saveBigDataToAcc=> send partial " + action + " len: " + s.length);
            this.PrepareAndPutNotification(actionpart, actionpart + ",000," + this.agent.m_AgentNo + "," + s + "," + this.agent.m_Extension);
        }
        var ss = bigdata.substr(i * 29000);
        this.log("saveBigDataToAcc=> send last part " + action + " len: " + ss.length);

        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + ss + "," + this.agent.m_Extension);
    }
    //=================[b64DecodeUnicode]==========================
    public b64DecodeUnicode(str: string): string {
        if (window
            && "atob" in window
            && "decodeURIComponent" in window) {
            return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(""));
        } else {
            console.warn("b64DecodeUnicode requirements: window.atob and window.decodeURIComponent functions");
            return null;
        }
    }
    //=================[b64EncodeUnicode]==========================
    public b64EncodeUnicode(str: string): string {
        if (window
            && "btoa" in window
            && "encodeURIComponent" in window) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode(("0x" + p1) as any);
            }));
        } else {
            console.warn("b64EncodeUnicode requirements: window.btoa and window.encodeURIComponent functions");
            return null;
        }

    }

    //***************************************************************
    //   GRIDS                        GRIDS                   GRIDS
    //***************************************************************
    gridSelectdTab: number = 0;
    AcdQRefreshInterval: number = 5000;
    AcdCurRefreshDate: Date = new Date();
    idShowGrid: boolean = false;
    public isOpenCalls: boolean = false;
    public CallStatus_ElapsedTime: number = -1;

    public isCallsLog: boolean = false;
    public isACDCalls: boolean = false;
    public isSetup: boolean = false;
    public isGrids = false;
    public isTelephony = false;
    public isPhonbook = false;
    public autoAnswerTime: Date = null;

    //=========================== [SendgetGroupQueueCPInfo] ===================
    SendgetGroupQueueCPInfo() {
        var action = 'getGroupQueueCPInfo';
        for (let i = 0; i < this.ACC.m_GroupsList.length; ++i) {
            if (this.ACC.m_GroupsList[i].Flag == true) {
                this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + this.agent.m_Extension + "," + this.ACC.m_GroupsList[i].Key);
            }
            this.AcdCurRefreshDate = null;
            this.AcdCurRefreshDate = new Date();
            this.AcdCurRefreshDate.setTime(this.AcdCurRefreshDate.getTime() + this.AcdQRefreshInterval);
        }
    }
    // =============== [Send_KeepAliveToAcc] ===============
    keepAliveCount: number = 0;
    keepAliveInterval: number = 5000; //5 seconds
    KACurRefreshDate: Date = new Date();
    //
    Send_KeepAliveToAcc() {
        var t: Date = new Date();
        if (t.getTime() >= this.KACurRefreshDate.getTime()) {
            this.keepAliveCount = 0;
            var action = 'keepalive';
            var logooned = this.agent != null ? this.agent.m_isLogon : 0;
            var parms =  action + ",000," + "KEEPALIVE,"  + logooned + ",,,";
            var accNotifications = new AccNotifications("t_s", "KEEPALIVE", action, parms);
            accNotifications.sessionid = this.sessionId;
            if (this.agaenLogin.username != "")
            {
                parms = action + ",000," + this.agaenLogin.username + ",,,";
                accNotifications.agentNo = this.agaenLogin.username;
            }
            this.accRequests(accNotifications);
            //
            this.KACurRefreshDate = null;
            this.KACurRefreshDate = new Date();
            this.KACurRefreshDate.setTime(this.KACurRefreshDate.getTime() + this.keepAliveInterval);
        }
    }

    // =============== [Send_getGroupQueueCPInfoToAcc] ===============
    Send_getGroupQueueCPInfoToAcc() {
        if (this.autoAnswerTime != null && this.agent.m_AgentStatus == AgentStatus.Ringing) {
            var t: Date = new Date();
            if (t.getTime() >= this.autoAnswerTime.getTime()) {
                this.autoAnswerTime = null;
                var action = 'answercall';
                var callid = this.getCurrentCallId();
                this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + callid + "," + this.agent.m_Extension);
                this.log("Auto answer, call id: " + callid);
            }
        }
        if (this.isACDCalls == false) { return };
        {
            var t: Date = new Date();
            if (t.getTime() >= this.AcdCurRefreshDate.getTime()) {
                this.SendgetGroupQueueCPInfo();
            }
        }
    }
    //=========================== [genericPrepareCP] =================
    genericPrepareCP(CpArray: string[], oc: OneCall, cp: any[]) {
        var one: any[] = [];
        // loop on agent calls status requested fields
        //oc.m_CP = [];
        var t: string;
        for (let i = 0; i < cp.length; i++) {
            var idx: number = Number(cp[i].Index);
            // mandatory CP

            if (idx < 10000) {
                for (let j = 0; j < CpArray.length; j++) {
                    var x: number = 2;
                    var cols: any = CpArray[j].split('|');
                    if (cols.length < 3) { x = 1; }
                    if (cols[0] == cp[i].Index) {
                        var aa =this.replaceall(cols[x],'@#$',',');
                        var cpf: any = new Key_Desc(cp[i].Header, aa, cols[0]);
                        one.push(cpf);
                        break;
                    }
                }
            }
            else {
                var cpf: any;
                switch (idx) {
                    case CP_EXT.IDX_CALLS_STAT_CALL_ACD_GROUP:
                        var sss: string = oc.m_AcdGroup;
                        var idxx = this.ACC.m_GroupsList.map(e => e.Key).indexOf(oc.m_AcdGroup);
                        if (idxx != -1) {
                            sss = this.ACC.m_GroupsList[idxx].Desc;
                        }
                        cpf = new Key_Desc(cp[i].Header, sss, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_ANI:
                        cpf =
                         new Key_Desc(cp[i].Header, oc.m_From, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_CALLED:
                        cpf = new Key_Desc(cp[i].Header, oc.m_To, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_CALLING_DEV:
                        cpf = new Key_Desc(cp[i].Header, oc.m_From, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_ELAPSED_TIME:
                        cpf = new Key_Desc(this.CP[i].Header, "Empty", '' + idx);
                        this.InsertUpdateCP(oc.m_CP, cpf, i);
                        this.CallStatus_ElapsedTime = i; // col index
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_LAST_REDIRECTION:
                        cpf = new Key_Desc(cp[i].Header, oc.m_LastRedirect, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_ORIG_CALLED:
                        cpf = new Key_Desc(cp[i].Header, oc.m_OriginalCalled, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA:
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_STATE:
                        cpf = new Key_Desc(cp[i].Header, AgentCallStateTxt[oc.m_CallState], '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_TIME:
                        t = this.getTwentyFourHourTime(oc.m_StartStatusDate);
                        cpf = new Key_Desc(cp[i].Header, t, '' + idx);
                        one.push(cpf);

                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_EXPAND_MEDIA:
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA_ICON:
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_START:
                        t = this.getTwentyFourHourDateTime(oc.m_StartStatusDate);
                        cpf = new Key_Desc(cp[i].Header, t, '' + idx);
                        one.push(cpf);
                        break;
                    //
                    case CP_EXT.IDX_CALLS_STAT_CALL_END:
                        t = this.getTwentyFourHourDateTime(oc.m_EndStatusDate);
                        cpf = new Key_Desc(cp[i].Header, t, '' + idx);
                        one.push(cpf);
                        break;
                    // 
                    case CP_EXT.IDX_CALLS_STAT_JOINING_CALL:
                        cpf = new Key_Desc(cp[i].Header, oc.m_To1, '' + idx);
                        one.push(cpf);
                        break;
                    default: break;
                }
            }
        }
        return one;
    }
    //********************[ Call status grid ]***********************
    //***************************************************************
    public getFieldName(idx: number, row: any) {
        var k = Object.keys(row);
        return row[k[idx]];
    }
    public CallsStatMeta: any = [];// { columnDef: 'position', header: 'No.',    cell: (element: any) => `${element.position}` }];
    CallsStatDisplayedColumns: any[] = [];//this.CallsStatMeta.map(c => c.columnDef);
    public CallsStatData: any[] = [{ 10007: "Conxxnected", 2: "5001", 1: "2002", 8: "18:33:53", 111: "ישראל", 105: "WALLER" }];//{position: 1}];
    callStatDataSource: any;//  CallData(this.CallsStatData); 
    //-------------------
    // up to 52 dynamic coloumns creation - 
    //    it done because JSON.parse sort by colounm name
    abc: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    public openCallTableLength: string = "300px";
 
    //{position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
     //======================[CallActions] ====================================
    DoCallAction(row: any, action: string) {
        var idx: number = this.GetCallByCallId(row.AA_CID);
        if (idx == -1) {
            //this.callsArray[idx];
            return;
        }
        var callid = this.getCurrentCallId();
        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + row.AA_CID + "," + this.agent.m_Extension);

    }
    //==========================[InsertNewCp]===============================
    public beforeIdx: number = -1;
    public CPorQCP: number = -1;
    public InsertNewCp(cp_idx: string, cp_header: string, cp_alignment: string, cp_width: string) {
        if (this.beforeIdx == -1) {
            this.log("InsertNewCp=> cannot add new CP idx = -1");
            return;
        }
        switch (this.CPorQCP) {
            case 0: // call status
                this.InsertNewCpx(cp_idx, cp_header, cp_alignment, cp_width);
                break;
            //
            case 1: // call log
                this.InsertNewLogCp(cp_idx, cp_header, cp_alignment, cp_width);
                break;
            //
            case 2: // ACD calls in queue
                this.InsertNewQCp(cp_idx, cp_header, cp_alignment, cp_width);
                break;
        }


    }
    //==========================[UpdateCp]===============================
    public UpdateCp(cp_idx: string, cp_header: string, cp_alignment: string, cp_width: string) {
        if (this.beforeIdx == -1) {
            this.log("InsertNewCp=> cannot add new CP idx = -1");
            return;
        }
        var newCp = { Index: cp_idx, Format: cp_alignment, Header: cp_header, Sort: "1", Width: cp_width };
        switch (this.CPorQCP) {
            case 0: // call status
                this.CP[this.beforeIdx] = newCp;
                this.UpdateCpLists();
                var callcp: Key_Desc = { Key: cp_idx, Desc: "", Id: this.beforeIdx.toString(), More: "", Flag: false };
                for (let i = 0; i < this.callsArray.length; i++) {
                    this.callsArray[i].m_CP[this.beforeIdx] = callcp;
                }
                break;
            //
            case 1: // call log
                this.LogCP[this.beforeIdx] = newCp;
                this.UpdateLogCpLists();
                break;
            //
            case 2: // ACD calls in queue
                this.QCP[this.beforeIdx] = newCp;
                this.UpdateQCpLists();
                break;
        }
    }
    //==========================[InsertNewCp]===============================
    public InsertNewQCp(cp_idx: string, cp_header: string, cp_alignment: string, cp_width: string) {
        var newCp = { Index: cp_idx, Format: cp_alignment, Header: cp_header, Sort: "1", Width: cp_width };
        this.QCP.splice(this.beforeIdx, 0, newCp);
        this.log("InsertNewCp=> Add new QCP field: " + newCp.Header + "; " + this.QCP.join());
        var callcp: Key_Desc = { Key: cp_idx, Desc: "", Id: this.beforeIdx.toString(), More: "", Flag: false };
        for (let i = 0; i < this.QueuedCalls.length; i++) {
            this.QueuedCalls[i].m_CP.splice(this.beforeIdx, 0, callcp);
        }
        this.UpdateQCpLists();
        this.beforeIdx = -1;
    }
    //==========================[InsertNewCp]===============================
    public InsertNewCpx(cp_idx: string, cp_header: string, cp_alignment: string, cp_width: string) {
        var newCp = { Index: cp_idx, Format: cp_alignment, Header: cp_header, Sort: "1", Width: cp_width };
        this.CP.splice(this.beforeIdx, 0, newCp);
        this.log("InsertNewCp=> Add new CP field: " + newCp.Header + "; " + this.CP.join());
        var callcp: Key_Desc = { Key: cp_idx, Desc: "", Id: this.beforeIdx.toString(), More: "", Flag: false };
        for (let i = 0; i < this.callsArray.length; i++) {
            this.callsArray[i].m_CP.splice(this.beforeIdx, 0, callcp);
        }
        this.UpdateCpLists();
        this.beforeIdx = -1;
    }
    //==========================[InsertNewLogCp]===============================
    public InsertNewLogCp(cp_idx: string, cp_header: string, cp_alignment: string, cp_width: string) {
        var newCp = { Index: cp_idx, Format: cp_alignment, Header: cp_header, Sort: "1", Width: cp_width };
        this.LogCP.splice(this.beforeIdx, 0, newCp);
        this.log("InsertNewLogCp=> Add new LOG CP field: " + newCp.Header + "; " + this.CP.join());
        var callcp: Key_Desc = { Key: cp_idx, Desc: "", Id: this.beforeIdx.toString(), More: "", Flag: false };
        for (let i = 0; i < this.callsLog.length; i++) {
            this.callsLog[i].m_CP.splice(this.beforeIdx, 0, callcp);
        }
        this.UpdateLogCpLists();
        this.beforeIdx = -1;
    }
    //==========================[DeleteCpField]===============================
    public DeleteCpField() {
        if (this.beforeIdx == -1) {
            this.log("InsertNewCp=> cannot delete CP field");
        }
        switch (this.CPorQCP) {
            case 0:
                this.CP.splice(this.beforeIdx, 1);
                for (let i = 0; i < this.callsArray.length; i++) {
                    this.callsArray[i].m_CP.splice(this.beforeIdx, 1);
                }
                this.UpdateCpLists();
                break;
            //
            case 1:
                this.LogCP.splice(this.beforeIdx, 1);
                this.UpdateLogCpLists();
                break;
            // 
            case 2:
                this.DeleteQCpField();
                break;
        }
        //
        this.beforeIdx = -1;
    }
    //==========================[DeleteQCpField]===============================
    public DeleteQCpField() {
        this.QCP.splice(this.beforeIdx, 1);
        for (let i = 0; i < this.QueuedCalls.length; i++) {
            this.QueuedCalls[i].m_CP.splice(this.beforeIdx, 1);
        }
        this.UpdateQCpLists();
        this.beforeIdx = -1;
    }
    //==========================[UpdateCpLists]===============================
    UpdateCpLists() {
        this.etasIni.CallsStatus.Columns = this.CP;
        this.prepareCallStatHeader();
        this.prepareCallStatusGridData();
        this.saveEtasIni();
    }
    //==========================[UpdateQCpLists]===============================
    UpdateQCpLists() {
        this.etasIni.ACDCalls.Columns = this.QCP;
        this.prepareCallQHeader();
        this.prepareCallQGridData();
        this.saveEtasIni();
    }
    //==========================[UpdateQCpLists]===============================
    UpdateLogCpLists() {
        this.etasIni.CallsLog.Columns = this.LogCP;
        this.prepareCallLogsHeader();
        this.prepareCallLogGridData();
        this.saveEtasIni();
    }
   //=========================================================================
    //=========================== [prepare Call Status Grid Data] =============
    //=========================================================================
    //=========================== [CalcElapessedTime] =============
    CalcElapessedTime(startTime: any, endTime: any) {
        var timeDiff = endTime - startTime; //in ms
        // strip the ms
        timeDiff /= 1000;
        var seconds = Math.round(timeDiff);
        var h = Math.round(seconds / 3600);
        var m = Math.round((seconds - (h * 3600)) / 60);
        var s = Math.round(seconds % 60);
        return this.pad(h, 2) + ":" + this.pad(m, 2) + ":" + this.pad(s, 2);
    }
    //=========================== [UpdateElapsedTime] =============
    UpdateElapsedTime() {
        for (let i = 0; i < this.callStatDataSource.length; i++) {
            var cid = this.callStatDataSource[i].AA_CID;
            if (cid == "") { continue; }
            var idx: number = this.GetCallByCallId(cid);
            if (idx == -1) { continue; }
            var oc: OneCall = this.callsArray[idx];
            var row = this.callStatDataSource[idx];
            var key = Object.keys(row)[this.CallStatus_ElapsedTime];
            var col = row[key];
            var elapepes = this.CalcElapessedTime(oc.m_StartStatusDate, new Date());
            row[key] = elapepes;
        }
    }
   //=========================== [prepareCallStatHeader] =============
   prepareCallStatHeader() {
    var CallsStatMetaX: any = [];
    var maxlength: number = 0;
    for (let i = 0; i < this.CP.length; i++) {
        var name: string = this.abc.substr(i, 1) + "_" + this.CP[i].Index;
        var style: string = this.CP[i].Width + 'px';
        maxlength += Number(this.CP[i].Width);
        var c: any = { field: name, header: this.CP[i].Header, width: style };
        CallsStatMetaX.push(c);
    }
    this.log("prepareCallStatHeader=> length: " + maxlength);
    this.openCallTableLength = '' + (maxlength + 25) + "px";
    this.CallsStatMeta = CallsStatMetaX;
    }

    //=========================== [updateCallStatHeaderReorder] =============
    updateCallStatHeaderReorder(cols: any[]) {
        var reorderCP: any = [];
        for (let i = 0; i < cols.length; i++){
            const el = this.CP.find(({ Header }) => Header === cols[i].header);
            reorderCP[i] = el;
        }
        this.CP = reorderCP;
        this.UpdateCpLists();
    }

    //=========================== [prepareCallStatusGridData] =============
    prepareCallStatusGridData() {
        var s = "[";
        var length =   this.callsArray.length;//this.callsArray.length > 4 ? this.callsArray.length : 5;
        for (let i = 0; i < length; i++) {
            var oc = null;
            if (i < this.callsArray.length) {
                oc = this.callsArray[i];
            }
            s += "{";
            for (let j = 0; j < this.CP.length; j++) {
                var name: string = this.abc.substr(j, 1) + "_" + this.CP[j].Index;
                var idx = -1;
                if (oc != null) {
                    idx = oc.m_CP.map(e => e.Id).indexOf(this.CP[j].Index);
                }
                if (idx != -1) {
                    if (oc.m_CP[idx].Id != CP_EXT.IDX_CALLS_STAT_CALL_ELAPSED_TIME) {
                        s += '"' + name + '":' + '"' + oc.m_CP[idx].Desc + '"';
                    }
                    else  {
                        var elapepes = this.CalcElapessedTime(oc.m_StartStatusDate, new Date());
                        s += '"' + name + '":' + '"' + elapepes + '"';
                    }
                }
                else {
                    s += '"' + name + '":' + '" "';
                }
                s += ', ';
            }

            //
            if (oc != null) {
                s += '"AA_CID":"' + oc.m_CallId + '"}';
            }
            else {
                s += '"AA_CID":"-1"}';
            }
            //s += "}";
            if (i < (length - 1))
                s += ",";
        }
        s += "]";
        try {
            //console.debug("row: " + s);
            this.callStatDataSource = [];
            this.callStatDataSource = JSON.parse(s);
         }
        catch (e) {
            this.ForceLogToServer("prepareCallStatusGridData,JSON.parse: " + s + "=>" + e.message);
            return;
        }
        //this.callStatDataSource = new MatTableDataSource(StatData);
        this.updateCallsCount();
    }
    //***************************************************************
    //********************[ Call Log grid ]**************************
    //***************************************************************
    public LogCP:any = [];
    public LogCPBase: any =
    [
        { Index: CP_CODES.GROUP_ID, Header: "ACD Group" },
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_ANI.toString(), Header: "Calling"},
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_CALLED.toString(), Header: "Called"},
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_START.toString(), Header: "Creation Time"},
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_END.toString(), Header: "Deletion Time"},
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_LAST_REDIRECTION.toString(), Header: "Last Redirection"},
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_STATE.toString(), Header: "Last State"},
        { Index: CP_EXT.IDX_CALLS_STAT_CALL_ORIG_CALLED.toString(), Header: "Originally Called"}
    ];

    public CallsLogMeta: any = [{}];// { columnDef: 'position', header: 'No.',    cell: (element: any) => `${element.position}` }];
    public CallsLogStatData: any[] = [];//{position: 1}];
    //====================[ getLogFieldName ] ========================
    public getLogFieldName(idx: number, row: any) {
        var k = Object.keys(row);
        return row[k[idx]];
    }

    //====================[ prepareCallLogsHeader ]====================
    public callLogsTableLength: string = "600px";
    prepareCallLogsHeader() {
        var CallsLogMetaX: any = [];
        var maxlength: number = 0;
        for (let i = 0; i < this.LogCP.length; i++) {
            var name: string = this.abc.substr(i, 1) + "_" + this.LogCP[i].Index;
            var style: string = this.LogCP[i].Width + 'px';
            maxlength += Number(this.LogCP[i].Width);
            var c: any = { field: name, header: this.LogCP[i].Header, width: style };
            let body = JSON.stringify(c);
            CallsLogMetaX.push(c);
        }
        this.callLogsTableLength = '' + (maxlength + 25) + "px";
        this.CallsLogMeta = CallsLogMetaX;
    }

    //=========================== [updateCallLogsHeaderReorder] =============
    updateCallLogsHeaderReorder(cols: any[]) {
        var reorderLogCP: any = [];
        for (let i = 0; i < cols.length; i++){
            const el = this.LogCP.find(({ Header }) => Header === cols[i].header);
            reorderLogCP[i] = el;
        }
        this.LogCP = reorderLogCP;
        this.UpdateLogCpLists();
    }

    //=========================== [prepareCallLogGridData] =============
    prepareCallLogGridData() {
        this.CallsLogStatData = [];
        var s = "[";
        var length = this.callsLog.length;
        for (let i = 0; i < length; i++) {
            var oc = null;
            var cps: any;
            var cplist: any[] = [];
            if (i < this.callsLog.length) {
                oc = this.callsLog[i];
                cps = oc.m_DeliveredResponse[4].split('^');
                cplist = this.genericPrepareCP(cps, oc, this.LogCP);
            }
            s += "{";
            for (let j = 0; j < this.LogCP.length; j++) {
                var name: string = this.abc.substr(j, 1) + "_" + this.LogCP[j].Index;
                var idx = -1;
                if (oc != null) {
                    idx = cplist.map(e => e.Id).indexOf(this.LogCP[j].Index);
                }
                if (idx != -1) {
                    s += '"' + name + '":' + '"' + cplist[idx].Desc + '"';
                }
                else {
                    s += '"' + name + '":' + '" "';
                }
                s += ', '
            }
            s += '"zzz_selected":"' + 0 + '",';
            s += '"zzz_note":"",';
            if (oc != null) {

                s += '"zzz_CID":"' + oc.m_CallId + '"}';
            }
            else {
                s += '"zzz_CID":"-1"}';
            }
            //s += "}";
            if (i < (length - 1))
                s += ",";
        }
        s += "]";
        try {
            //console.debug("row: " + s);
            this.CallsLogStatData = JSON.parse(s);
        }
        catch (e) {
            this.ForceLogToServer("prepareCallLogGridData,JSON.parse: " + s + "=>" + e.message);
            return;
        }
    }

    //***************************************************************
    //********************[ Call ACD QUEUE grid ]*******************
    //**************************************************************
    public QCP: any[] = [];
    public CallsQMeta: any = [{}];// { columnDef: 'position', header: 'No.',    cell: (element: any) => `${element.position}` }];
    public CallsQStatMeta: any[] = [];//{position: 1}];
    callsQDataSource: any;
    //====================[ getQFieldName ] ========================
    public getQFieldName(idx: number, row: any) {
        var k = Object.keys(row);
        return row[k[idx]];
    }
    //====================[ prepareCallQHeader ]====================
    
    public CallQTableLength: string = "300px";
    prepareCallQHeader() {
        var CallsStatMetaX: any = [];
        var maxlength: number = 0;

        for (let i = 0; i < this.QCP.length; i++) {
            try {
                var name: string = this.abc.substr(i, 1) + "_" + this.QCP[i].Index;
                var style: string = this.QCP[i].Width + 'px';
                maxlength += Number(this.QCP[i].Width);
                var c: any = { field: name, header: this.QCP[i].Header, width: style };
                let body = JSON.stringify(c);
                CallsStatMetaX.push(c);
            } catch (e) {
                console.error("prepareCallQHeader exceptionn: " + i + " " + e.message);
            }
        }
        this.log("prepareCallQHeader=> length: " + maxlength);
        this.CallQTableLength = '' + (maxlength + 25) + "px";
        this.CallsQStatMeta = CallsStatMetaX;
    }

    //=========================== [updateCallLogsHeaderReorder] =============
    updateCallQHeaderReorder(cols: any[]) {
        var reorderQCP: any = [];
        for (let i = 0; i < cols.length; i++){
            const el = this.QCP.find(({ Header }) => Header === cols[i].header);
            reorderQCP[i] = el;
        }
        this.QCP = reorderQCP;
        this.UpdateQCpLists();
    }

    //=========================== [prepareCallQGridData] =============
    prepareCallQGridData() {
        this.callsQDataSource = [];
        var length = this.QueuedCalls.length;
        var s = "[";
        for (let i = 0; i < length; i++) {
            var oc = null;
            oc = this.QueuedCalls[i];
            s += "{";
            for (let j = 0; j < this.QCP.length; j++) {
                var name: string = this.abc.substr(j, 1) + "_" + this.QCP[j].Index;
                var idx = -1;
                if (oc != null) {
                    idx = oc.m_CP.map(e => e.Key).indexOf(this.QCP[j].Index);
                }
                if (idx != -1) {
                    s += '"' + name + '":' + '"' + oc.m_CP[idx].Desc + '"';
                }
                else {
                    s += '"' + name + '":' + '" "';
                }
                s += ', '
            }
            //
            if (oc != null) {
                s += '"AA_CID":"' + oc.m_CallId + '"}';
            }
            else {
                s += '"AA_CID":"-1"}';
            }
            if (i < (length - 1))
                s += ",";
        }
        s += "]";
        try {
            //this.log("row: " + s);
            this.callsQDataSource = JSON.parse(s);
        }
        catch (e) {
            this.log("prepareCallQGridData,JSON.parse: " + s + "=>" + e.message);
            return;
        }
    }     
    //***************************************************************
    //********************[ Handle group login/logour ]*************
    //**************************************************************
    //====================[ HandleloginGroups ]===========true- login, false logout==========
    HandleloginPrimaryLogoutGroups(groups: string, inout: boolean) {
        var isLoginPrimary: boolean = false;
        var l = groups.split('|');
        // if (inout == true && l.length == 0)
        // {
        //     this.ShowAlert("No assigned group");
        // }
        if (this.ACC.m_GroupsList.length == 0) {
            this.log("HandleloginPrimaryLogoutGroups=> empty group list when login/logout - error");
            return false;
        }
        var AtLeastOnePrimay: boolean = false;
        //for (let i = 0; i < this.ACC.m_GroupsList.length; i++) {
        for (let i = 0; i < l.length; ++i) {
            if (l[i] == "") continue;
            var g = l[i].split(';');

            var idx: number = this.ACC.m_GroupsList.map(c => c.Key).indexOf(g[0]);
            if (idx == -1) {
                this.log("HandleloginPrimaryLogoutGroups=> group not found: " + g[0]);
                continue;
            }
            this.ACC.m_GroupsList[idx].Flag = inout;
            this.accagentPage.chart = null;
            this.PSWQtot.ACDQGroups  = [];
            this.ACC.m_GroupsList[idx].More = g[1]; // 1 = primary,0 =
            if (g[1] == "1") { isLoginPrimary = true; }
        }
        this.sendStatisticsRequest();
        return isLoginPrimary;
    }
 
     //====================[Handlel Telephony windows]=====================
     public TelephonyActions: accbutton[] = [];
    TelActionsList: accbutton[] = [];
    AcdActionsList: accbutton[] = [];
    WinActionsList: accbutton[] = [];
    OtherActionsList: accbutton[] = [];
    public CurActionList: accbutton[] = [];
    public category_idx: string = "";
    public action_idx: string = "";
    public action_desc: string = "";
    //
    public telTransferToAgent: boolean = false;
    public telReleaseCode: boolean = false;
    public telWUCode: boolean = false;
    public telNumber: boolean = false;
    public telGrp: boolean = false;
    public ChooseCategoryAndAction: boolean = false;
    public ShowCategoryAndAction: boolean = false;
    //
    public TelCurrentActionUpdted: number = -1;
    public TelCurrAction: accbutton = null;
    //
    captionSaved: string = "";
    dataSaved: string = "";
    codeSave: string = "";
   //====================[TelBtnActivgetDataByActionType]=================
    TelBtnActivgetDataByActionType(actionType) {
        this.TelCurrAction.isMust = false;
        this.telNumber = false;
        switch (actionType) {

            case "TransferToAgent":
                this.TelCurrAction.isMust = true;
                this.telTransferToAgent = true;
                break;
            //
            case "ReleasewithCode":
                this.TelCurrAction.isMust = true;
                this.telReleaseCode = true;
                break;
            //
            case "WrapupCode":
                this.TelCurrAction.isMust = true;
                this.telWUCode = true;
                break;
            //
            case "StartConsultation":
            case "TransferCall":
            case "MakeNACall":
            case "SilentMonitor":
            case "Whisper":
            case "BrakeIn":
            case "PhoneNumber":
                this.TelCurrAction.isMust = true;
                this.telNumber = true;
                break;
            //
            case "LoginGroup":
                this.TelCurrAction.isMust = true;
                this.telGrp = true;
                break;
            //
            default: break;
        }
    }
    //====================[PrepareTelBtnWin]=================
    PrepareTelBtnWin(idx: number) {
        this.TelCurrentActionUpdted = idx;
        this.TelCurrAction = this.TelephonyActions[idx];
        var a: AccOneButton2 = AccButtons.find(x => x.Array[0].Code == this.TelCurrAction.code);
        this.category_idx = a.type;
        this.action_idx = this.TelCurrAction.code;
        var bt; this.trnslt.get(a.Array[0].title).subscribe((text: string) => { this.action_desc = text });
        this.telNewBtnDialog = true;
        this.TelBtnActivgetDataByActionType(this.TelCurrAction.code);
    }
    //====================[GetChosenActionList]=================
    GetChosenActionList(type: string) {
        switch (type) {
            case "ACD":
                return this.AcdActionsList;
                break;
            //
            case "Telephony":
                return this.TelActionsList;
                break;
            //
            case "WINDOW":
                return this.WinActionsList;
                break;
            //
            case "OTHER":
                return this.OtherActionsList;
                break;
            default: return [];
        }
    }
    //====================[ClearBtnShowFlags]=================
    ClearBtnShowFlags() {
        this.telTransferToAgent = false;
        this.telReleaseCode = false;
        this.telWUCode = false;
        this.telNumber = false;
        this.telGrp = false;
        this.ChooseCategoryAndAction = false;
        this.ShowCategoryAndAction = false;
    }
    //
    //====================[ preareTelephonyDirectory ]=================
    //====================[prepareTelephony]=================
    prepareTelephony(basecfg: any) {
        var totalActions = basecfg.NumberOfActions;
        var e: accbutton = new accbutton(0, "<not selected>", "", "", "", "", false, false, "", "", "");
        this.TelephonyActions = [];
        this.AcdActionsList = [];
        this.TelActionsList = [];
        this.OtherActionsList = [];
        this.WinActionsList = [];
        this.AcdActionsList.push(e);
        this.TelActionsList.push(e);
        this.OtherActionsList.push(e);
        this.WinActionsList.push(e);
        //
        var e: accbutton = new accbutton(0, "", "", "", "", "", false, false, "", "", "");
        for (let i: number = 0; i < totalActions; i++) {
            var n: accbutton = new accbutton(i, "", "", "", "", "", false, false, "", "", "");
            this.TelephonyActions.push(n);
        }
        for (let y = 0; y < AccButtons.length; ++y) {
            var a: AccOneButton2 = AccButtons[y];
 

            var b = new accbutton(a.id, a.Array[0].title, a.Array[0].class,
                a.Array[0].color, a.click, a.Array[0].img,
                a.candrag, a.must, a.Description, a.Array[0].Code, a.datatype);

            if (b.code == 'CompleteConference'){
                b.titlesrc = a.Array[1].title;            
                b.title = a.Array[1].title;
            }                
            var c = null;
            if (a.Array.length > 1 && a.Array[0].Code != a.Array[1].Code) {
                c = new accbutton(a.id, a.Array[1].title, a.Array[1].class,
                    a.Array[1].color, a.click, a.Array[1].img,
                    a.candrag, a.must, a.Description, a.Array[1].Code, a.datatype);
            }
            if (b.code == "Release") { b.titlesrc = b.code = "Resume"; c.titlesrc = c.code = "Release"; }
            switch (a.type) {
                case "ACD":
                    this.AcdActionsList.push(b);
                    if (c != null) {
                        this.AcdActionsList.push(c);
                    }
                    break;
                //
                case "TEL":
                    this.TelActionsList.push(b);
                    if (c != null) {
                        this.AcdActionsList.push(c);
                    }
                    break;
                //
                case "WIN":
                    this.WinActionsList.push(b);
                    break;
                //
                case "OTHER":
                    this.OtherActionsList.push(b);
                    break;
            }
        }
        for (let i = 0; i < basecfg.actions.length; i++) {
          try{
            var value: any = basecfg.actions[i];
            var idx = basecfg.actions[i].Idx;
            var b = this.TelephonyActions[idx];
            b.id = idx;
            var ai = 0;
            var a: AccOneButton2 = AccButtons.find(x => x.Array[0].Code == value.Function);
            if (a == null) {
                if (value.Function == "Resume") {
                    a = AccButtons.find(x => x.Array[0].Code == "Release");
                    ai = 1;
                }
            }
            if (a == null) {
                this.log("prepareTelephony action not found: " + basecfg.actions.Function);
            }
            else {
                var b = new accbutton(a.id, value.Caption, a.Array[ai].class,
                    a.Array[ai].color, a.click, a.Array[ai].img, a.candrag, a.must,
                    a.Description, a.Array[ai].Code, a.datatype);
                this.PrepareBtnTitle(b, idx, value.Data, a.must);
            }
        }
        catch(e){
            console.error("prepareTelephony(): " + e.message);
        }
        }
    }
    //====================[PrepareBtnTitle]=================
    PrepareBtnTitle(button: accbutton, idx: number, data: string, must: boolean) {
        if (button.titlesrc == "") // has value
        {
            return "Missing caption";
        }
        var bt; this.trnslt.get(button.titlesrc).subscribe((text: string) => { bt = text });
        button.title = bt + "\n" + button.data;
        button.isSet = true;
        button.data = data;
        button.title = bt + "\n" + button.data;
        // Set specail css class for progrsmmed buttons 
        switch (button.code) {
            case "TransferToAgent":
                if (button.isSet == true) button.class += " transferToAgent";
                var j = this.agentsReadyList.map(e => e.name).indexOf(button.data);
                button.title = bt + "\n" + data;
                break;
            //
            case "ReleasewithCode":
                button.class += " relasecode";
                var j = this.ACC.m_ReleaseCodesList.map(e => e.Key).indexOf(button.data);
                button.title = bt + "\n" + this.ACC.m_ReleaseCodesList[j].Desc;
                break;
            //
            case "WrapupCode":
                button.class += " wrapupcode";
                var j = this.ACC.m_WrapUpCodesList.map(e => e.Key).indexOf(button.data);
                button.title = bt + "\n" + this.ACC.m_WrapUpCodesList[j].Desc;
                break;
            //
            case "MakeNACall":
                button.class += " makecall";
                break;
            //
            case "TransferCall":
                button.class += " transfer";
                break;
            //
            case "StartConsultation":
                button.class += " cunsultation";
                break;
            //
            case "SilentMonitor":
                button.class += " silentmonitor";
                break;
            //
            case "BrakeIn":
                button.class += " breakin";
                break;
            //
            case "LoginGroup":
                //button.class += " group";
                var j = this.ACC.m_GroupsList.map(e => e.Key).indexOf(button.data);
                button.title = bt + "\n" + this.ACC.m_GroupsList[j].Desc;
                break;
            //
            default: break;
        }
        this.TelephonyActions[idx] = button;
        return "";
    }

      //=========================== [About] =============
    About() {
        //2019-07-08 AlisherM BZ#50123: show ACC_VERSION in About page, so we can check if browser got updated caode after update of ACC server
        //NOTE: ACC_VERSION will be replaced during build
        this.ShowAlert('Aeonix Contact Center Agent version ' + this.ACC_VERSION);
    }

    //2019-09-26 AlisherM BZ#50840: handle event according to configuration file CRM.json
    HandleCRMEvent(callEvent: string, oc: OneCall) {
        if (this.CRM == null || this.CRM.Event == null)
        {
            this.log("HandleCRMEvent ERROR: CRM configuration doesn't exist, skip handling event " + callEvent);
            return;
        }

        this.log("HandleCRMEvent received event " + callEvent);

        oc.m_CurEvent = callEvent; //save current event, so it can be used as CP field '%%Event%%'

        var event_config: any = null;
        switch (callEvent)
        {
            case "OnLogon":
                event_config = this.CRM.Event.OnLogon;
                break;
            case "OnLogoff":
                event_config = this.CRM.Event.OnLogoff;
                break;
            case "OnLoggedIn":
                event_config = this.CRM.Event.OnLoggedIn;
                break;
            case "OnLoggedOut":
                event_config = this.CRM.Event.OnLoggedOut;
                break;
            case "OnReady":
                event_config = this.CRM.Event.OnReady;
                break;
            case "OnReleased":
                event_config = this.CRM.Event.OnReleased;
                break;
            case "OnResumed":
                event_config = this.CRM.Event.OnResumed;
                break;
            case "OnWrapUp":
                event_config = this.CRM.Event.OnWrapUp;
                break;
            case "OnReserved":
                event_config = this.CRM.Event.OnReserved;
                break;
            case "OnSilentStarted":
                event_config = this.CRM.Event.OnSilentStarted;
                break;
            case "OnDenied":
                event_config = this.CRM.Event.OnDenied;
                break;
            case "OnIncoming":
                event_config = this.CRM.Event.OnIncoming;
                break;
            case "OnIncomingACD":
                event_config = this.CRM.Event.OnIncomingACD;
                break;
            //2-Aug-2022 YR BZ#56567
            case "OnOutgoing":
                event_config = this.CRM.Event.OnOutgoing;
                break;
                case "OnConnected":
                event_config = this.CRM.Event.OnConnected;
                break;
            case "OnConnectedACD":
                event_config = this.CRM.Event.OnConnectedACD;
                break;
            case "OnHeld":
                event_config = this.CRM.Event.OnHeld;
                break;
            case "OnRetrieved":
                event_config = this.CRM.Event.OnRetrieved;
                break;
            case "OnConferenced":
                event_config = this.CRM.Event.OnConferenced;
                break;
            case "OnCleared":
                event_config = this.CRM.Event.OnCleared;
                break;
            case "OnClearedACD":
                event_config = this.CRM.Event.OnClearedACD;
                break;
            case "Salesforce_OnClickToDial":
                event_config = this.CRM.Event.Salesforce_OnClickToDial;
                break;
            default:
                this.log("HandleCRMEvent WARNING: unknown event " + callEvent);
                return;
                break;
        }

        if (event_config != null && Array.isArray(event_config))
        {
            for (let crmaction of event_config)
            {
                this.ExecuteCRMAction(crmaction, callEvent, oc);
            }
        }
        else
        {
            this.log("HandleCRMEvent WARNING: didn't find configuration of event " + callEvent);
        }
    }

    //2019-09-26 AlisherM BZ#50840: call CRM actions according to CRM type (Salesforce, HTTP, ACC)
    ExecuteCRMAction(crmaction: any, callEvent: string, oc: OneCall) {
        try
        {
            if (crmaction == null || crmaction.Action == null)
            {
                this.log("ExecuteCRMAction ERROR: skip null crmaction of event " + callEvent);
                return;
            }
    
            var action_name: string;
                
            if (crmaction.Action == "")
            {
                this.log("ExecuteCRMAction skip empty crmaction of event " + callEvent);
                return;
            }
            else if (crmaction.Action.search(this.CPFDelimeter) > -1)
            {
                action_name = this.ReplaceALLCPFNamesByValues(crmaction.Action, oc);
                this.log("ExecuteCRMAction replaced CPF in crmaction " + crmaction.Action + ": " + action_name + " of event " + callEvent);
            }
            else
            {
                action_name = crmaction.Action;
            }

            var action_type: any = action_name.split("_");

            switch (action_type[0])
            {
                case "HTTP":
                    this.log("ExecuteCRMAction execute " + action_type[0] + " crmaction " + action_name + " of event " + callEvent);
                    switch (action_name)
                    {
                        case "HTTP_PopupURL":
                            this.HTTP_PopupURL(crmaction, oc);
                        break;
                        case "HTTP_SendWSRequest":
                            this.HTTP_SendWSRequest(crmaction, oc);
                        break;
                        default:
                            this.log("ExecuteCRMAction WARNING: unknown " + action_type[0] + " crmaction " + action_name + " of event " + callEvent);
                        break;
                    }
                break;
                case "ACC":
                    this.log("ExecuteCRMAction execute " + action_type[0] + " crmaction " + action_name + " of event " + callEvent);
                    switch (action_name)
                    {
                        case "ACC_MakeCall":
                            this.ACC_MakeCall(crmaction, oc);
                        break;
                        case "ACC_MakeOACDCall":
                            this.log("ExecuteCRMAction crmaction " + action_name + " is not implemented yet");
                        break;
                        case "ACC_Wait":
                            this.ACC_Wait(crmaction, oc);
                        break;
                        default:
                            this.log("ExecuteCRMAction WARNING: unknown " + action_type[0] + " crmaction " + action_name + " of event " + callEvent);
                        break;
                    }
                break;
                case "Salesforce":
                    if (this.salesforce == null)
                    {
                        this.log("ExecuteCRMAction WARNING: agent is not running under Salesforce environment, skip crmaction " + action_name + " of event " + callEvent);
                    }
                    else
                    {
                        this.log("ExecuteCRMAction execute " + action_type[0] + " crmaction " + action_name + " of event " + callEvent);
                        switch (action_name)
                        {
                            case "Salesforce_SetVisibility":
                                this.salesforce.SetVisibility(crmaction, oc);
                            break;
                            case "Salesforce_OpenObject":
                                this.salesforce.OpenObject(crmaction, oc);
                            break;
                            case "Salesforce_CreateObject": //general action to create standard and custom objects
                                this.salesforce.CreateObject("CP", crmaction, oc);
                            break;
                            case "Salesforce_CreateLead":
                                this.salesforce.CreateObject("Lead", crmaction, oc);
                            break;
                            case "Salesforce_CreateCase":
                                this.salesforce.CreateObject("Case", crmaction, oc);
                            break;
                            case "Salesforce_CreateOpportunity":
                                this.salesforce.CreateObject("Opportunity", crmaction, oc);
                            break;
                            case "Salesforce_CreateAccount":
                                this.salesforce.CreateObject("Account", crmaction, oc);
                            break;
                            case "Salesforce_CreateContact":
                                this.salesforce.CreateObject("Contact", crmaction, oc);
                            break;
                            case "Salesforce_OpenFlow":
                                this.log("ExecuteCRMAction crmaction " + action_name + " is not implemented yet");
                            break;
                            case "Salesforce_RunApex":
                                this.log("ExecuteCRMAction crmaction " + action_name + " is not implemented yet");
                            break;
                            case "Salesforce_Search":
                                this.log("ExecuteCRMAction crmaction " + action_name + " is not implemented yet");
                            break;
                            case "Salesforce_SearchAndScreenPop":
                                this.salesforce.SearchAndScreenPop(crmaction, oc);
                            break;
                            case "Salesforce_SaveLog":
                                this.salesforce.SaveLog(crmaction, oc);
                                //this.log("ExecuteCRMAction crmaction " + action_name + " is not implemented yet");
                            break;
                            default:
                                this.log("ExecuteCRMAction WARNING: unknown " + action_type[0] + " crmaction " + action_name + " of event " + callEvent);
                            break;
                        }
                    }  
                break;
                default:
                    this.log("ExecuteCRMAction WARNING: unknown crmaction type" + action_type[0] + " of event " + callEvent);
                break;
            }
        }
        catch (e)
        {
            this.ForceLogToServer("ExecuteCRMAction ERROR: got exception '" + e.message + "' while executed crmaction " + action_name + " of event " + callEvent);
        }
    }

    //=========================== [getPrivateCP] =============
    //
    getPrivateCP(idx: number, oc: OneCall) {
        var CPvalue: string = "";
        switch (idx) {
            case CP_EXT.IDX_CALLS_STAT_CALL_ACD_GROUP:
                var sss: string = oc.m_AcdGroup;
                var idxx = this.ACC.m_GroupsList.map(e => e.Key).indexOf(oc.m_AcdGroup);
                if (idxx != -1) {
                    CPvalue = this.ACC.m_GroupsList[idxx].Desc;
                }
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_ANI:
                CPvalue = oc.m_From;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_CALLED:
                CPvalue = oc.m_To;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_CALLING_DEV:
                CPvalue = oc.m_From;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_ELAPSED_TIME:
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_LAST_REDIRECTION:
                CPvalue = oc.m_LastRedirect;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_ORIG_CALLED:
                CPvalue = oc.m_OriginalCalled;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA:
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_STATE:
                CPvalue = AgentCallStateTxt[oc.m_CallState];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_TIME:
                CPvalue = this.getTwentyFourHourTime(oc.m_StartStatusDate);
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_EXPAND_MEDIA:
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA_ICON:
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_MEDIA_ICON:
                break;
            case CP_EXT.IDX_CALLS_STAT_CALL_START:
                CPvalue = this.getTwentyFourHourTime(oc.m_StartStatusDate);
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_CALL_END:
                CPvalue = this.getTwentyFourHourTime(oc.m_EndStatusDate);
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_JOINING_CALL:
                CPvalue = oc.m_To1;
                break;

            case CP_EXT.IDX_CALLS_STAT_CUR_EVENT:
                CPvalue = oc.m_CurEvent;
                break;
            //2020-06-22 AlisherM BZ#52606: in case of event OnLogon agent don't receive yet list of call profile fields from server, so set following 2 parameters manually
            case CP_EXT.IDX_CALLS_STAT_AGENT_NUMBER:
                CPvalue = this.agent.m_AgentNo;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_AGENT_EXTENSION:
                CPvalue = this.agent.m_Extension;
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_NUMBER_OF_CALLS:
                CPvalue = this.callsArray.length.toString();
                break;
            //
            //2020-08-10 AlisherM BZ#52754: set 10 private CP fields for HTTP response
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE1:
                if (this.http_responses[0] != undefined)    
                    CPvalue = this.http_responses[0];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE2:
                if (this.http_responses[1] != undefined)    
                    CPvalue = this.http_responses[1];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE3:
                if (this.http_responses[2] != undefined)    
                    CPvalue = this.http_responses[2];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE4:
                if (this.http_responses[3] != undefined)    
                    CPvalue = this.http_responses[3];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE5:
                if (this.http_responses[4] != undefined)    
                    CPvalue = this.http_responses[4];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE6:
                if (this.http_responses[5] != undefined)    
                    CPvalue = this.http_responses[5];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE7:
                if (this.http_responses[6] != undefined)    
                    CPvalue = this.http_responses[6];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE8:
                if (this.http_responses[7] != undefined)    
                    CPvalue = this.http_responses[7];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE9:
                if (this.http_responses[8] != undefined)    
                    CPvalue = this.http_responses[8];
                break;
            //
            case CP_EXT.IDX_CALLS_STAT_HTTP_RESPONSE10:
                if (this.http_responses[9] != undefined)    
                    CPvalue = this.http_responses[9];
                break;
            //
             default: break;
        }
        return CPvalue;
    }

   //=========================== [ReplaceCPFNameByValue] =============
   ReplaceCPFNameByValue(fullUrl: string, oc: OneCall) {
        var cps: string[] = ['-0', '-1', '-2', '-3', '-4'];
        if (oc.m_DeliveredResponse[4] != null) 
        {
            cps = oc.m_DeliveredResponse[4].split('^');
        }
        var newUrl: string = "";
        var splitUrl: any = fullUrl.split(this.CPFDelimeter);
        var i: number = 0;
        for (var i = 0; i < splitUrl.length; i++) {
            var paranName = splitUrl[i];
            var entry = null;
            var cpentry: number = this.ACC.m_CallProfileLists.map(x => x.Desc).indexOf(paranName);
            if (cpentry == -1) {
                var cpentry: number = CP_EXT_FIELDS.map(x => x.col_desc).indexOf(paranName);
                if (cpentry == -1) {
                    newUrl += splitUrl[i];
                    continue;
                }
                var value1 = this.getPrivateCP(CP_EXT_FIELDS[cpentry].col_idx, oc);
                newUrl += value1;
            }
            else {
                entry = cps.find(b => b.includes(this.ACC.m_CallProfileLists[cpentry].Key + '|'));
                if (entry == null) { continue; }
                var value: string[] = entry.split('|');
                newUrl += value[1];
            }
        }
        return newUrl;
    }

    ReplaceALLCPFNamesByValues(orig_str: string, oc: OneCall) {
        var new_str: string = "";
        //TODO: function ReplaceCPFNameByValue works incorrectly in sting like : 'Agent Number%%string%%Agent number'
        //it will return string: '1001string1001', while expected exact same string 'Agent Number%%string%%Agent number' since there is no proper call profile name
        //So we need to implement new 'correct' algorithm

        //NOTE: CPFDelimeter is configurable and may have dynamic length, for example %, ^^, @CPF_DEL@

        var cur_pos: number = 0;
        
        while (cur_pos < orig_str.length)
        {
            var cpf_name = "";
            var cpf_value = this.CPF_DOES_NOT_EXIST;
            //search for opening delimiter from last cur_pos
            var del_pos1 = orig_str.indexOf(this.CPFDelimeter, cur_pos);
            var del_pos2: number = -1;
            
            //if found and it's not end of the string, then search for closing delimiter
            if (del_pos1 != -1 && del_pos1 + this.CPFDelimeter.length != orig_str.length)
            {
                del_pos2 = orig_str.indexOf(this.CPFDelimeter, del_pos1 + this.CPFDelimeter.length);
                //if found closing delimiter and it's not right after opening delimeter (%%%%), then check if it's known CPField
                if (del_pos2 != -1 && del_pos2 != del_pos1 + this.CPFDelimeter.length)
                {
                    cpf_name = orig_str.substring(del_pos1 + this.CPFDelimeter.length, del_pos2);
                    cpf_value = this.GetCPFValueByName(cpf_name, oc);
                    //NOTE: if call profile field name exists, but not found in call, we just replace it by empty value
                    if (cpf_value == this.CPF_NOT_FOUND_IN_CALL)
                    {
                        cpf_value = "";
                    }
                }
            }

            if (cpf_value == this.CPF_DOES_NOT_EXIST)
            {
                if (del_pos2 == -1)
                {
                    new_str += orig_str.substring(cur_pos);  
                    cur_pos = orig_str.length;
                }
                else //copy all excluding closing delimiter and set curr_pos to closing delimiter, since closing delimiter can be opening delimeter of cpf_name, for example: text%%text2%%cpf1%%text3
                {
                    new_str += orig_str.substring(cur_pos, del_pos2);
                    cur_pos = del_pos2;
                }
            }
            else //if cpf_name exist, then replace %%cpf_name%% by cpf_value
            {
                new_str += orig_str.substring(cur_pos, del_pos1);
                new_str += cpf_value;
                cur_pos = del_pos2 + this.CPFDelimeter.length;
            }
        }

        //print just for debug
        //this.log("ReplaceALLCPFNamesByValues orig_str: '" + orig_str + "'");
        //this.log("ReplaceALLCPFNamesByValues new_str : '" + new_str  + "'");
        return new_str;
    }

    GetCPFValueByName(cpf_name: string, oc: OneCall) 
    {
        //cpf_name - call profile field name without delimeters
        //return value of call profile field name or
        //CPF_DOES_NOT_EXIST - if string provided by cpf_name is not existing call profile field name
        //CPF_NOT_FOUND_IN_CALL - if string provided by cpf_name is existing call profile field name, but not found in current call

        var cpf_value: string = "";

        var cps: string[] = ['-0', '-1', '-2', '-3', '-4'];
        
        if (oc.m_DeliveredResponse[4] != null) 
        {
            cps = oc.m_DeliveredResponse[4].split('^');
        }
        
        //search call profile field by name in configuration (m_CallProfileLists)
        var cpentry: number = this.ACC.m_CallProfileLists.map(x => x.Desc).indexOf(cpf_name);
        if (cpentry == -1) //if not found, then try to search it in additional cp list
        {
            cpentry = CP_EXT_FIELDS.map(x => x.col_desc).indexOf(cpf_name);
            if (cpentry == -1) // if not found, then return CPF_DOES_NOT_EXIST (it means string provided by cpf_name is not existing call profile field name)
            {
                cpf_value = this.CPF_DOES_NOT_EXIST;
            }
            else //return value
            {
                cpf_value = this.getPrivateCP(CP_EXT_FIELDS[cpentry].col_idx, oc);
            }
        }
        else //if call profile field exist (in configuration), then search value in call profile of the call
        {
            var cps_entry = null;
            //2020-06-22 AlisherM BZ#52606: replaced .includes() by .indexOf(), since cps array may have elements like: "1019|4006", "19|1006"
            //in case if you search for "19|", then .includes() will return first matching element "1019|4006" which is wrong
            //while .indexOf() will return non zero value (2)
            cps_entry = cps.find(b => b.indexOf(this.ACC.m_CallProfileLists[cpentry].Key + '|') == 0); 
            if (cps_entry == null) // if not found, then return CPF_NOT_FOUND_IN_CALL (it means string provided by cpf_name is existing call profile field name, but not found in current call)
            {
                //2020-06-22 AlisherM BZ#52606: call profile fields 'Agent Number' and 'Agent Extension' are duplicated in standard and extended lists, so try to check in extended list also
                cpentry = CP_EXT_FIELDS.map(x => x.col_desc).indexOf(cpf_name);
                if (cpentry == -1) // if not found, then return CPF_NOT_FOUND_IN_CALL (it means string provided by cpf_name is valid call profile field name, but not found in call)
                {
                cpf_value = this.CPF_NOT_FOUND_IN_CALL;
            }
            else //return value
            {
                    cpf_value = this.getPrivateCP(CP_EXT_FIELDS[cpentry].col_idx, oc);
                }
            }
            else //return value
            {
                var cps_value: string[] = cps_entry.split('|');
                cpf_value = cps_value[1];
            }
        }
        return cpf_value;
    } //end of GetCPFValueByName

    //2019-10-02 AlisherM BZ#50840: add call profile name/value to call, used in onClickToDial event with simulated call
    AddCPFtoCall(cpf_name: string, cpf_value: string, oc: OneCall)
    {
        var cpf_entry: number = this.ACC.m_CallProfileLists.map(x => x.Desc).indexOf(cpf_name);
        var cpf_key: string;
        this.log("AddCPFtoCall <" + cpf_name + ":" + cpf_value);
        if (cpf_entry == -1) //2020-06-22 AlisherM BZ#52606: if not found in standard call profile map, then check also in extended call profile fields
        {
            cpf_entry = CP_EXT_FIELDS.map(x => x.col_desc).indexOf(cpf_name);
            if (cpf_entry == -1)
            {
                this.log("AddCPFtoCall - NOT FOUND " + cpf_name);
                return;
            }
            else //return value
            {
                cpf_value = this.getPrivateCP(CP_EXT_FIELDS[cpf_entry].col_idx, oc);
                cpf_key = CP_EXT_FIELDS[cpf_entry].col_idx.toString();
            }
        }
        else
        {
            cpf_key = this.ACC.m_CallProfileLists[cpf_entry].Key;
        }
        
        if (oc.m_DeliveredResponse[4] == null)
        {
            oc.m_DeliveredResponse[4] = cpf_key + "|" + cpf_value + "^";
        }
        else if (oc.m_DeliveredResponse[4].search("/"+cpf_key+"|.*^/") != -1) //this call profile field already exist, so need to update its's value
        {
            oc.m_DeliveredResponse[4] = oc.m_DeliveredResponse[4].replace("/"+cpf_key+"|.*^/g", cpf_key + "|" + cpf_value + "^");
        }
        else //this call profile field doesn't exist, so add it to the end
        {
            oc.m_DeliveredResponse[4] = oc.m_DeliveredResponse[4] + cpf_key + "|" + cpf_value + "^";
        }
        
    } //end of AddCPFtoCall

    //=========================== [TestExecuteWithouCallCrm] =============
    TestExecuteWithouCallCrm(url: string) {
        open(url, "", "left=0,width=800,height=600");
    }
    //=========================== [TestExecuteCallCrm] =============
    TestExecuteCallCrm(oc: OneCall, url) {
        var i: number = 0;
        if (oc.m_DeliveredResponse[4] != null) 
        {
        var cps = oc.m_DeliveredResponse[4].split('^');
        }
        try {
            if (url == undefined || url == "") { return; }
            var fullUrl: string = url;
            var newUrl: string = "";

            //1st replacement of cpf names by value
            newUrl = this.ReplaceCPFNameByValue(fullUrl, oc);

            //2nd replacement of cpf names by value, for cases when cpf contains inside reference to another cpf
            newUrl = this.ReplaceCPFNameByValue(newUrl, oc);

            //2019-05-14 AlisherM BZ#49794: check resulted url, if it's empty, then don't popup
            //NOTE: do we want to open url which doesn't start with http?
            if (newUrl != "") {
                this.log("popupurl: " + newUrl);
                //open("", "", "resizable = no,location = no,width=" + 2000 + ",height=100,left=260, top=40");
                open(newUrl, "", "left=0,width=800,height=600");
            }
        }
        catch (e) {
            this.log("TestExecuteCallCrm Exception=> param indedx: " + i + "; " + e.message);
        }
    }
    // =================[closeWindow]=================================
    closeWindow(idx) {
        //
        switch (idx) {
            case 0:
                this.isOpenCalls = false;
                this.CallStatus_ElapsedTime = -1;
                break;
            //
            case 1:
                this.isCallsLog = false;
                break;
            //
            case 2:
                this.isACDCalls = false;
                this.AcdCurRefreshDate = null;
                this.QueuedCalls = [];
                break;
            //
            case 3:
                this.isTelephony = false;
                break;
            //
            case 4:
                this.isPhonbook = false;
                break;
            //
            case 5:
                this.isSetup = false;
                break;
            //
        }
        if (this.isOpenCalls == false && this.isCallsLog == false &&
            this.isACDCalls == false && this.isTelephony == false &&
            this.isPhonbook == false && this.isSetup == false) {
            this.isGrids = false;
            window.resizeTo(this.screenWidth, window.innerHeight);
            //window.resizeBy(this.screenWidth,window.innerHeight);

            //2019-05-14 AlisherM BZ#49794: resize toolbar iFrame in Salesforce according to size of toolbar size
            if (this.isSalesforce) {
                this.salesforce.setNormalIFrameSize();
            }
        }
    }
    // ======================[sendStatisticsRequest]===================
    sendStatisticsRequest() {
        var action = 'getPersonalStatistics';
        if (this.agent != null)
        {
            if (this.ShowPST)
            {
                this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + ",");
            }
        }
    }

    // drags
    LastDDroprag: string = "";
    public drag_start(event, gridtype: string) {
        var style = window.getComputedStyle(event.target, null);
        var l: any = style.getPropertyValue("left");
        var t: any = style.getPropertyValue("top");
        if (l == 'auto') l = 0;
        if (t == 'auto') t = 0;
        l = l - event.clientX;
        t = t - event.clientY;
        var str = '' + l + ',' + t + ',' + gridtype;
        event.dataTransfer.setData(gridtype, str);
        this.LastDDroprag = gridtype;
    }

    // =========================[drop]==============================
    public drop(event) {
        var offset = event.dataTransfer.getData(this.LastDDroprag).split(',');
        var dm = document.getElementById(offset[2]);
        var mainx = document.getElementById("Grids");
        mainx.removeChild(mainx.childNodes[1]);
        dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
        dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
        mainx.appendChild(dm);
        event.preventDefault();
        return false;
    }
    //  =======================[drag_over]===========================
    public drag_over(event) {
        event.preventDefault();
        return false;
    }

    // ======================[getTwentyFourHourTime]===================
    getTwentyFourHourDateTime(d: Date) {
        var d1 = d.getDay();
        var d2 = d.getUTCDate();
        var m1 = d.getMonth();
        var m2 = d.getUTCMonth();
        var datex: string = d.getUTCFullYear() + "-" + this.pad(d.getMonth() + 1, 2) + "-" + this.pad(d2, 2);
        return datex + ' ' + this.pad(d.getHours(), 2) + ':' + this.pad(d.getMinutes(), 2) + ':' + this.pad(d.getSeconds(), 2);
    }
    // ======================[getTwentyFourHourTime]===================
    getTwentyFourHourTime(d: Date) {
        var d1 = d.getDay();
        var d2 = d.getUTCDate();
        var m1 = d.getMonth();
        var m2 = d.getUTCMonth();
        var datex: string = d.getUTCFullYear() + "-" + this.pad(d.getMonth() + 1, 2) + "-" + this.pad(d2, 2);
        return this.pad(d.getHours(), 2) + ':' + this.pad(d.getMinutes(), 2) + ':' + this.pad(d.getSeconds(), 2);
    }
    // ======================[pad]===================
    pad(num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
    // ======================[notifyMe]===================
    notifyMe(title, message) {
        const options = {
            body: "",
            icon: './favicon.ico'
        };
        window.focus();
        var d: Date = new Date();
        var d_str = this.getTwentyFourHourTime(d);
        options.body = message + "\n" + d_str;
        // Let's check if the browser supports notifications
        if (!("Notification" in window)) {
            alert("This browser does not support system notifications");
        }
        // Let's check whether notification permissions have already been granted
        else if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            var notification = new Notification(title, options);
        }
        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    var notification = new Notification(title, options);
                }
            });
        }
        // Finally, if the user has denied notifications and you 
        // want to be respectful there is no need to bother them any more.
    }
    Answer: AccOneButton2 =
        {
            type: "TEL", must: false, datatype: "none", candrag: true, id: "answer1CallId", Count: 2, click: "answerCall", Description: "Answer incoming call",
            Array: [{
                Code: "Answer",
                title: "Answer",
                class: "answerimg",
                style: "",
                color: "white",
                img: "assets/images/acc/tel_answer_a_call.jpg"
            }, {
                Code: "Answer",
                title: "Answer",
                class: "answerimg activatBlink",
                style: "",
                color: "white",
                img: "assets/images/acc/tel_answer_a_call.jpg"
            }]
        }

    RetrieveCRMActionParameterByName(param_name: string, crmaction: any, oc: OneCall)
    {
        var param_value: string;
        var param_type: string;

        //1st get optional parameter from action in CRM.json
        if (crmaction[param_name] != null && crmaction[param_name] != "")
        {
            param_type = "static";
            param_value = crmaction[param_name];
        }
        //if it doesn't exist in CRM.json, then search it in CP
        else
        {
            param_type = "dynamic";
            param_value = this.GetCPFValueByName(param_name, oc);
        }

        this.log(crmaction.Action + ' ' + param_type + ' ' + param_name + ': ' +  param_value);

        //make 2nd replacement of CPF name
        if (param_value.search(this.CPFDelimeter) > -1)
        {
            param_value = this.ReplaceALLCPFNamesByValues(param_value, oc);
            this.log(crmaction.Action + ' replaced CPF in ' + param_name + ': ' +  param_value);
        }

        return param_value;
    } //RetrieveCRMActionParameterByName

    GetValueByPrefixAndSuffix(orig_str: string, prefix: string, suffix: string)
    {
        var pos1: number = 0;
        var pos2: number;
        var value: string = "";

        if (prefix != "")
        {
            pos1 = orig_str.indexOf(prefix);
        }

        if (pos1 < 0) //prefix not found
            return value;
        
        if (suffix == "")
        {
            pos2 = orig_str.length;
        }
        else
        {
            pos2 = orig_str.indexOf(suffix, pos1 + prefix.length);
        }
        
        if (pos2 < 0) //suffix not found 
            return value;

        value = orig_str.substring(pos1 + prefix.length, pos2);
        return value;
    } //GetValueByPrefixAndSuffix
    
    //2019-10-02 AlisherM BZ#50840: implement HTTP actions which can be configured via CRM.json
    HTTP_PopupURL(crmaction: any, oc: OneCall)
    {
        var HTTP_URL: string = this.RetrieveCRMActionParameterByName("HTTP_URL", crmaction, oc);
        if (HTTP_URL == "" || HTTP_URL == this.CPF_DOES_NOT_EXIST || HTTP_URL == this.CPF_NOT_FOUND_IN_CALL)
        {
            this.log('HTTP_PopupURL WARNING: mandatory parameter HTTP_URL is empty or not found, skip action');
            return;
        }
        // now replace all cp fields in HTTP_URL
        var temp = this.ReplaceALLCPFNamesByValues(HTTP_URL,oc);
        console.log("HTTP_URL before: " + HTTP_URL + ", After: " + temp);
        if (temp == "" || temp == this.CPF_DOES_NOT_EXIST || temp == this.CPF_NOT_FOUND_IN_CALL)
        {
            this.log('HTTP_PopupURL WARNING: CP fields inside HTTP_URL not found not found, skip action');
            return;
        }
        HTTP_URL = temp;
         //2020-06-22 AlisherM BZ#52612: replace parameters HTTP_HEIGHT and HTTP_WIDTH by HTTP_WINDOW_FEATURES to give more flexibility for integrators to manage popup window behaviour
        var HTTP_WINDOW_FEATURES: string = this.RetrieveCRMActionParameterByName("HTTP_WINDOW_FEATURES", crmaction, oc);
        if (HTTP_WINDOW_FEATURES == this.CPF_DOES_NOT_EXIST || HTTP_WINDOW_FEATURES == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_WINDOW_FEATURES = ""; //default is blank (open new tab in existing browser window)
        }       

        //open("", "", "resizable = no,location = no,width=" + 2000 + ",height=100,left=260, top=40");
        var popup_window = open(HTTP_URL, "", HTTP_WINDOW_FEATURES);
        if (popup_window != null)
        {
            popup_window.focus();
        }
        else
        {
            this.log('HTTP_PopupURL WARNING! failed to open popup window, probably it is blocked by browser settings');
        }

    } //end of HTTP_PopupURL

    //2020-08-09 AlisherM BZ#52754: implement web services actions which can be configured via CRM.json
    HTTP_SendWSRequest(crmaction: any, oc: OneCall)
    {
        var HTTP_URL: string = this.RetrieveCRMActionParameterByName("HTTP_URL", crmaction, oc);
        if (HTTP_URL == "" || HTTP_URL == this.CPF_DOES_NOT_EXIST || HTTP_URL == this.CPF_NOT_FOUND_IN_CALL)
        {
            this.log('HTTP_SendWSRequest WARNING: mandatory parameter HTTP_URL is empty or not found, skip action');
            return;
        }

        var HTTP_METHOD: string = this.RetrieveCRMActionParameterByName("HTTP_METHOD", crmaction, oc);
        if (HTTP_METHOD == "" || HTTP_METHOD == this.CPF_DOES_NOT_EXIST || HTTP_METHOD == this.CPF_NOT_FOUND_IN_CALL)
        {
            this.log('HTTP_SendWSRequest WARNING: mandatory parameter HTTP_METHOD is empty or not found, set it to default method GET');
            HTTP_METHOD = 'GET';
        }

        var HTTP_BODY: string = this.RetrieveCRMActionParameterByName("HTTP_BODY", crmaction, oc);
        if (HTTP_BODY == this.CPF_DOES_NOT_EXIST || HTTP_BODY == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_BODY = "";
        }

        var HTTP_HEADERS: string = this.RetrieveCRMActionParameterByName("HTTP_HEADERS", crmaction, oc);
        if (HTTP_HEADERS == this.CPF_DOES_NOT_EXIST || HTTP_HEADERS == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_HEADERS = "";
        }
        else //HTTP_HEADERS format: "header1: value1" or "header1: value1|header2: value2|header3: value3"
        {
            var HHeaders= new HttpHeaders();
            HTTP_HEADERS.split('|').forEach(function (line) {
                var index = line.indexOf(':');
                if (index > 0) {
                    var name = line.slice(0, index);
                    var value = line.slice(index + 1).trim();
                    HHeaders = HHeaders.append(name, value);
                }
            });
        }

        //get prefix and suffix for all (10) private CP fields HTTP_RESPONSEx and save them in arrays
        var http_response_prefixes: string[] = [];
        var http_response_suffixes: string[] = [];

        var HTTP_RESPONSE1_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE1_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE1_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE1_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE1_PREFIX = "";
        }
        http_response_prefixes[0] = HTTP_RESPONSE1_PREFIX;

        var HTTP_RESPONSE1_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE1_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE1_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE1_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE1_SUFFIX = "";
        }
        http_response_suffixes[0] = HTTP_RESPONSE1_SUFFIX;

        var HTTP_RESPONSE2_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE2_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE2_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE2_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE2_PREFIX = "";
        }
        http_response_prefixes[1] = HTTP_RESPONSE2_PREFIX;

        var HTTP_RESPONSE2_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE2_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE2_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE2_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE2_SUFFIX = "";
        }
        http_response_suffixes[1] = HTTP_RESPONSE2_SUFFIX;

        var HTTP_RESPONSE3_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE3_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE3_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE3_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE3_PREFIX = "";
        }
        http_response_prefixes[2] = HTTP_RESPONSE3_PREFIX;

        var HTTP_RESPONSE3_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE3_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE3_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE3_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE3_SUFFIX = "";
        }
        http_response_suffixes[2] = HTTP_RESPONSE3_SUFFIX;

        var HTTP_RESPONSE4_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE4_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE4_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE4_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE4_PREFIX = "";
        }
        http_response_prefixes[3] = HTTP_RESPONSE4_PREFIX;

        var HTTP_RESPONSE4_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE4_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE4_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE4_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE4_SUFFIX = "";
        }
        http_response_suffixes[3] = HTTP_RESPONSE4_SUFFIX;


        var HTTP_RESPONSE5_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE5_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE5_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE5_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE5_PREFIX = "";
        }
        http_response_prefixes[4] = HTTP_RESPONSE5_PREFIX;

        var HTTP_RESPONSE5_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE5_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE5_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE5_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE5_SUFFIX = "";
        }
        http_response_suffixes[4] = HTTP_RESPONSE5_SUFFIX;

        var HTTP_RESPONSE6_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE6_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE6_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE6_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE6_PREFIX = "";
        }
        http_response_prefixes[5] = HTTP_RESPONSE6_PREFIX;

        var HTTP_RESPONSE6_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE6_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE6_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE6_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE6_SUFFIX = "";
        }
        http_response_suffixes[5] = HTTP_RESPONSE6_SUFFIX;

        var HTTP_RESPONSE7_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE7_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE7_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE7_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE7_PREFIX = "";
        }
        http_response_prefixes[6] = HTTP_RESPONSE7_PREFIX;

        var HTTP_RESPONSE7_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE7_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE7_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE7_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE7_SUFFIX = "";
        }
        http_response_suffixes[6] = HTTP_RESPONSE7_SUFFIX;

        var HTTP_RESPONSE8_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE8_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE8_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE8_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE8_PREFIX = "";
        }
        http_response_prefixes[7] = HTTP_RESPONSE8_PREFIX;

        var HTTP_RESPONSE8_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE8_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE8_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE8_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE8_SUFFIX = "";
        }
        http_response_suffixes[7] = HTTP_RESPONSE8_SUFFIX;

        var HTTP_RESPONSE9_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE9_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE9_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE9_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE9_PREFIX = "";
        }
        http_response_prefixes[8] = HTTP_RESPONSE9_PREFIX;

        var HTTP_RESPONSE9_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE9_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE9_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE9_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE9_SUFFIX = "";
        }
        http_response_suffixes[8] = HTTP_RESPONSE9_SUFFIX;

        var HTTP_RESPONSE10_PREFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE10_PREFIX", crmaction, oc);
        if (HTTP_RESPONSE10_PREFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE10_PREFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE10_PREFIX = "";
        }
        http_response_prefixes[9] = HTTP_RESPONSE10_PREFIX;

        var HTTP_RESPONSE10_SUFFIX: string = this.RetrieveCRMActionParameterByName("HTTP_RESPONSE10_SUFFIX", crmaction, oc);
        if (HTTP_RESPONSE10_SUFFIX == this.CPF_DOES_NOT_EXIST || HTTP_RESPONSE10_SUFFIX == this.CPF_NOT_FOUND_IN_CALL)
        {
            HTTP_RESPONSE10_SUFFIX = "";
        }
        http_response_suffixes[9] = HTTP_RESPONSE10_SUFFIX;

        var AAS: AccAgentService = this;
        //send async HTTP request
        //NOTE: currently you can't use response in next crmaction even if you use action 'Wait', because JavaScript has only one thread response parsing will be done only after all crmaction of current event, but you may use responce in another event
        //There is another solution: we can set next crmaction (which should use response of current crmaction) as parameter of current crmaction, then it will be handled after parsing of response
        //This solution wasn't implemented yet due to lack of time
        var http_observable = this.http.request(HTTP_METHOD, HTTP_URL, {body: HTTP_BODY, headers: HHeaders, responseType: "text"});
        http_observable.subscribe(
        {
            next(response) 
            {
                AAS.log('HTTP_SendWSRequest ' + HTTP_METHOD + ' request to HTTP_URL: ' +  HTTP_URL + ' succeed, response: ' + response);

                for (let i = 0; i < http_response_prefixes.length; i++)
                {
                    var j: number = i + 1;
                    if (http_response_prefixes[i] != "" && http_response_suffixes[i] != "" )
                    {
                        AAS.log('HTTP_SendWSRequest trying to retrieve value from response by HTTP_RESPONSE' + (i + 1) + '_PREFIX (' + http_response_prefixes[i] + ') and HTTP_RESPONSE' + (i + 1) + '_SUFFIX (' + http_response_suffixes[i] +')');
                        AAS.http_responses[i] = AAS.GetValueByPrefixAndSuffix(response, http_response_prefixes[i], http_response_suffixes[i]);
                        //AAS.log('HTTP_SendWSRequest save in private call profile field HTTP_RESPONSE' + (i + 1) + ' with value: ' + AAS.http_responses[i]);
                    }
                }
            },
            error(error)
            {
                console.log('HTTP_SendWSRequest ' + HTTP_METHOD + ' request to HTTP_URL: ' +  HTTP_URL + ' failed, error: ', error);
                AAS.log('HTTP_SendWSRequest ' + HTTP_METHOD + ' request to HTTP_URL: ' +  HTTP_URL + ' succeed, response: ' + error);
            }
        });
    } //end of HTTP_SendWSRequest

    //2020-08-09 AlisherM BZ#52754: added action ACC_Wait in order to use response of HTTP_SendWSRequest in next crmaction, but this didn't work because JavaScript has only one thread
    //I kept this action anyway, maybe it can be usefull in other scenarios
    ACC_Wait(crmaction: any, oc: OneCall)
    {
        var MSEC: string = this.RetrieveCRMActionParameterByName("MSEC", crmaction, oc);
        if (MSEC == "" || MSEC == this.CPF_DOES_NOT_EXIST || MSEC == this.CPF_NOT_FOUND_IN_CALL)
        {
            MSEC = "";
            this.log('ACC_Wait ERROR: MSEC is empty or not found, skip action');
            return;
        }

        var milliseconds: number = Number(MSEC);

        const date1 = Date.now();
        let date2 = null;
        do 
        {
            date2 = Date.now();
        } 
        while (date2 - date1 < milliseconds);
    } //ACC_Wait

    //2019-10-02 AlisherM BZ#50840: implement ACC actions which can be configured via CRM.json
    ACC_MakeCall(crmaction: any, oc: OneCall)
    {
        var EVENT: string = "";
        var CLICK2DIAL_NUMBER: string = ""; //number should be set in "fake call" in event onClickToDial
        //NOTE: following parameters can be set ONLY staticly in CRM.json, since there is no existing call yet
        var CLICK2DIAL_PREFIX: string = "";
        var CLICK2DIAL_PREFIX_type: string = "";
        var SF_APEX_CLASS: string = "";
        var SF_APEX_CLASS_type: string = "";
        var SF_APEX_METHOD: string = "";
        var SF_APEX_METHOD_type: string = "";
        var SF_APEX_PARAMS: string = "";
        var SF_APEX_PARAMS_type: string = "";
        var CLICK2DIAL_PREFIX_TRANSLATE_TABLE: string = "";
        var CLICK2DIAL_PREFIX_TRANSLATE_TABLE_type: string = "";
        
        //get parameter EVENT from private call profile field
        EVENT = this.GetCPFValueByName("Event", oc);
        if (EVENT == "" || EVENT == this.CPF_DOES_NOT_EXIST || EVENT == this.CPF_NOT_FOUND_IN_CALL)
        {
            this.log('ACC_MakeCall ERROR: Event is empty or not found, skip action');
            return;
        }

        //get parameter CLICK2DIAL_NUMBER from call profile
        CLICK2DIAL_NUMBER = this.GetCPFValueByName("CLICK2DIAL_NUMBER", oc);
        if (CLICK2DIAL_NUMBER == "" || CLICK2DIAL_NUMBER == this.CPF_DOES_NOT_EXIST || CLICK2DIAL_NUMBER == this.CPF_NOT_FOUND_IN_CALL)
        {
            this.log('ACC_MakeCall ERROR: CLICK2DIAL_NUMBER is empty or not found, skip action');
            return;
        }

        //get optional parameter CLICK2DIAL_PREFIX from action in CRM.json
        if (crmaction.CLICK2DIAL_PREFIX != null && crmaction.CLICK2DIAL_PREFIX != "")
        {
            CLICK2DIAL_PREFIX_type = "static";
            CLICK2DIAL_PREFIX = crmaction.CLICK2DIAL_PREFIX;
            //save CLICK2DIAL_PREFIX in call profile for cases of RunApex
            this.AddCPFtoCall("CLICK2DIAL_PREFIX", CLICK2DIAL_PREFIX, oc);
        }

        this.log('ACC_MakeCall EVENT: ' + EVENT + ', CLICK2DIAL_NUMBER: ' + CLICK2DIAL_NUMBER + ', CLICK2DIAL_PREFIX: ' +  CLICK2DIAL_PREFIX);

        //first need to understand who is the source of event (which integration) NOTE: currently it's only Salesforce_OnClickToDial, but in future we'll have more
        switch (EVENT)
        {
            case "Salesforce_OnClickToDial":
                //in case of Salesforce_OnClickToDial we have option to get CLICK2DIAL_PREFIX from Salesforce (dynamicly) by using APEX code, so let's check configuration in CRM.json
            
                //get optional parameter SF_APEX_CLASS from action in CRM.json
                if (crmaction.SF_APEX_CLASS != null && crmaction.SF_APEX_CLASS != "")
                {
                    SF_APEX_CLASS_type = "static";
                    SF_APEX_CLASS = crmaction.SF_APEX_CLASS;
                    //save SF_APEX_CLASS in call profile for cases of RunApex
                    this.AddCPFtoCall("SF_APEX_CLASS", SF_APEX_CLASS, oc);
                }

                //get optional parameter SF_APEX_METHOD from action in CRM.json
                if (crmaction.SF_APEX_METHOD != null && crmaction.SF_APEX_METHOD != "")
                {
                    SF_APEX_METHOD_type = "static";
                    SF_APEX_METHOD = crmaction.SF_APEX_METHOD;
                    //save SF_APEX_METHOD in call profile for cases of RunApex
                    this.AddCPFtoCall("SF_APEX_METHOD", SF_APEX_METHOD, oc);
                }

                //get optional parameter SF_APEX_PARAMS from action in CRM.json
                if (crmaction.SF_APEX_PARAMS != null && crmaction.SF_APEX_PARAMS != "")
                {
                    SF_APEX_PARAMS_type = "static";
                    SF_APEX_PARAMS = crmaction.SF_APEX_PARAMS;
                    //save SF_APEX_PARAMS in call profile for cases of RunApex
                    this.AddCPFtoCall("SF_APEX_PARAMS", SF_APEX_PARAMS, oc);
                }

                //get optional parameter CLICK2DIAL_PREFIX_TRANSLATE_TABLE from action in CRM.json
                if (crmaction.CLICK2DIAL_PREFIX_TRANSLATE_TABLE != null && crmaction.CLICK2DIAL_PREFIX_TRANSLATE_TABLE != "")
                {
                    CLICK2DIAL_PREFIX_TRANSLATE_TABLE_type = "static";
                    CLICK2DIAL_PREFIX_TRANSLATE_TABLE = crmaction.CLICK2DIAL_PREFIX_TRANSLATE_TABLE;
                    //save CLICK2DIAL_PREFIX_TRANSLATE_TABLE in call profile for cases of RunApex
                    //NOTE: since we save CLICK2DIAL_PREFIX_TRANSLATE_TABLE as call profile string, we can't use signs '^' and "|" in it
                    this.AddCPFtoCall("CLICK2DIAL_PREFIX_TRANSLATE_TABLE", CLICK2DIAL_PREFIX_TRANSLATE_TABLE, oc);
                }

                this.log('ACC_MakeCall SF_APEX_CLASS: ' +  SF_APEX_CLASS + ', SF_APEX_METHOD: ' +  SF_APEX_METHOD + ', SF_APEX_PARAMS: ' +  SF_APEX_PARAMS + ', CLICK2DIAL_PREFIX_TRANSLATE_TABLE: ' +  CLICK2DIAL_PREFIX_TRANSLATE_TABLE);

                if (SF_APEX_CLASS != "" && SF_APEX_METHOD != "") //if configured to execute APEX code, then retrieve parameters and run salesforce.MakeCallRunApex, otherwise just execute makeCall 
                {
                    if (SF_APEX_PARAMS == "") //theorerically SF_APEX_METHOD may not have params, so just set it to default value 'none' 
                    {
                        SF_APEX_PARAMS = "none";
                    }

                    //make 2nd replacement of CPF name
                    if (SF_APEX_PARAMS.search(this.CPFDelimeter) > -1)
                    {
                        SF_APEX_PARAMS = this.ReplaceALLCPFNamesByValues(SF_APEX_PARAMS, oc);
                        this.log('ACC_MakeCall replaced CPF in SF_APEX_PARAMS: ' +  SF_APEX_PARAMS);
                    }

                    var param = {
                        apexClass: SF_APEX_CLASS, 
                        methodName: SF_APEX_METHOD, 
                        methodParams: SF_APEX_PARAMS,
                        callback: this.salesforce.MakeCallRunApexCallback
                    };

                    this.salesforce.MakeCallRunApex(param, oc);
                    return;
                }
                else
                {
                    this.log('ACC_MakeCall SF_APEX_CLASS and/or SF_APEX_METHOD are not configured, just make a call...');
                }
                break;
            default:
                this.log('ACC_MakeCall ERROR: unknown EVENT: ' + EVENT + ', skip action');
                return;
                break;
        }

        this.makeCall(CLICK2DIAL_NUMBER, CLICK2DIAL_PREFIX);
    } //end of ACC_MakeCall

    //====================[ sendChatMessage ] ========================
    public sendChatMes(message: string) {
        console.log("send Chat message: " + message);
        var action = "agentomnimessage";
        var callid = this.getCurrentCallId();

        this.PrepareAndPutNotification(action, action + ",000," + this.agent.m_AgentNo + "," + callid + "," + message + ",true," + "" + ",0,");
    }

    //=========================== [Help] =============
    Help(fnm: string) 
    {
        var url: string = 'assets/AccHelp/' + fnm;
        // this.setupDocRef = window.open("", "", "resizable=0,toolbar=0,menubar=0,location=0,width=" + "" +  ",height=100,left=" + (window.screenLeft + 20) + ", top=" + topx);
        window.open(url, "", "resizable=0,toolbar=0,menubar=0,location=0,width=500,height=800,left=250, top=20");
    }

    timer1:any = null;
    public subscription1: any = null;
    beforeUnloadHanderTimer() {
        this.timer1 = timer(0, 500);
            var TT: any = this;
            this.ForceLogToServer("beforeUnloadHanderTimer subscribe timer to 5 secs");
            this.subscription1 = this.timer1.subscribe(x => {
                TT.ForceLogToServer("beforeUnloadHanderTimer==> after wait 5 seconds");
                TT.ClearCredintial();
                TT.subscription1 = TT.subscription1.unsubscribe();
                TT.subscription1 = null;

            });
     }
         // ]=========================== [copyImg ]===================================
    copyImg(imgcall: accbutton, isset: boolean) {
        var img: accbutton = new accbutton(imgcall.id,
            imgcall.titlesrc,
            imgcall.class,
            imgcall.color,
            imgcall.click,
            imgcall.img,
            imgcall.canDrag,
            imgcall.isMust,
            imgcall.description,
            imgcall.code,
            imgcall.datatype);
        img.isSet = isset;
        return img;
    }
}

//
//***************************************************************
//***************************[ END Class] ***********************
//***************************************************************
