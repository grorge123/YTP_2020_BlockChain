// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

contract DecentralizeDelivery {
    
    struct coordinate{
        uint x;
        uint y;
    }
    struct Food{
        coordinate From;
        coordinate To;
        uint money;
        address[] deliver;
        uint deliver_cnt;
        bool get;
        bool finish;
        uint set_time;
        uint cnt_num;
        address user;
    }
    struct User{
        uint money;//錢
        uint UserType;//使用者類型
        coordinate where;//使用者位置
        uint[] bought;//買賣紀錄
    }
    struct TranslateImformation{
        coordinate where;
        uint cnt;
    }
    mapping (address => bool) public is_admin;
    
    uint Food_cnt = 0;
    mapping (uint => Food) public FoodList;
    Food[] uncheck;
    mapping (address => User) public users;
    address[] worked;
    TranslateImformation[] TranslateList;
    mapping (address => uint[]) finishwork;
    constructor(){
        is_admin[msg.sender] = true;
    }
    //判斷是否是管理員
    modifier onlyAdmin() {
        require(is_admin[msg.sender], "Only admins can use this function!");
        _;
    }
    //新增管理員
    function addAdmin(address addr) onlyAdmin()  public {
        is_admin[addr] = true;
    }
    //刪除合約，不要碰它
    function destroy() onlyAdmin() public{
        selfdestruct(msg.sender);
    } 
	//查詢call function的人的錢
    function Find_money() view public returns(uint){
        return users[msg.sender].money;
    }
    //設定某人的金錢為多少
    function setmoney(address addr, uint money) onlyAdmin()  public {
        users[addr].money = money;
    }
    //轉錢給人
    function transmoney(address addr, uint money) public{
        require(users[msg.sender].money > money, "You do not have enough money");
        users[addr].money += money;
        users[msg.sender].money -= money;
    }
    //增加使用者
    function adduser(address addr, uint _money, uint _UserType, uint _x, uint _y) onlyAdmin() public {
        users[addr].money = _money;
        users[addr].UserType = _UserType;
        users[addr].where.x = _x;
        users[addr].where.y = _y;
    }
    //更新位置
    function updateXY(uint _x, uint _y) public{
        users[msg.sender].where.x = _x;
        users[msg.sender].where.y = _y;
    }
    //外送員上工
    function update_work() public{
        worked.push(msg.sender);
    }
	//外送員下班
    function update_unwork() public{
        uint i;
        for(i = 0 ; i < worked.length ; i++)
            if(worked[i] == msg.sender){
                delete worked[i];
                break;
            }
    }
	//下訂單
    function buildFood(uint FX, uint FY, uint TX, uint TY, uint _money, uint _time) public {
        coordinate memory _From;
        _From.x = FX;
        _From.y = FY;
        coordinate memory _To;
        _To.x = TX;
        _To.y = TY;
        require(users[msg.sender].money > _money, "You don't have enough money to build this order");
        uint nownum = Food_cnt;
        Food_cnt += 1;
        users[msg.sender].bought.push(nownum);
        FoodList[nownum].From = _From;
        FoodList[nownum].To = _To;
        FoodList[nownum].money = _money;
        FoodList[nownum].get = false;
        FoodList[nownum].finish = false;
        FoodList[nownum].set_time = _time;
        FoodList[nownum].cnt_num = nownum;
        FoodList[nownum].user = msg.sender;
        uncheck.push(FoodList[nownum]);
        users[msg.sender].money -= _money;
    }
	//判斷句離的function
    function Distance(coordinate memory a, coordinate memory b) pure public returns(uint){
        return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
    }
	//找尋目前自己可接的工作
    function findwork(uint now_time)public view returns(Food [10] memory){
        Food[10] memory re;
        uint find = 0;
        for(uint i = 0 ; i < uncheck.length && find < 10; i++){
            uint rated = 0;
            for(uint q = 0 ; q < worked.length ; q++){
                if(worked[q] == msg.sender)continue;
                if(Distance(users[worked[q]].where, uncheck[i].From) < Distance(users[msg.sender].where, uncheck[i].From))rated += 1;
            }
            if((now_time - uncheck[i].set_time) / 10 >= rated){
                re[find]=uncheck[i];
                find += 1;
            }
        }
        return re;
    }
    //外送員接單
    function getwork(uint cnt) public {
        Food memory get;
        bool find = false;
        for(uint i = 0 ; i < uncheck.length ; i++){
            if(uncheck[i].cnt_num == cnt){
                get = uncheck[i];
                delete uncheck[i];
                find = true;
            }
        }
        require(find,"Can't find this order");
        require(users[msg.sender].money > get.money, "You don't have enough money to get this order");
        FoodList[get.cnt_num].deliver.push(msg.sender);
        FoodList[get.cnt_num].get = true;
        users[msg.sender].money -= get.money;
        
    }
    //交易訂單
    function transorder(address other, uint cnt, uint x, uint y) public {
        require(FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1] == msg.sender, "You are not this order deliver");
        FoodList[cnt].deliver.push(other);
        users[msg.sender].money += FoodList[cnt].money;
        users[other].money -= FoodList[cnt].money;
        TranslateImformation memory TI;
        TI.where.x = x;
        TI.where.y = y;
        TI.cnt = cnt;
        TranslateList.push(TI);
    }
    //完成訂單
    function finish(uint cnt)public{
        require(FoodList[cnt].user == msg.sender, "You are not this order user");
        users[FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1]].money += FoodList[cnt].money;
        FoodList[cnt].finish = true;
        for(uint i = 0 ; i < FoodList[cnt].deliver.length ; i++){
            finishwork[FoodList[cnt].deliver[i]].push(cnt);
        }
    }
    //查詢食物運送狀況
    function FollowFood(uint cnt)view public returns(address){
        require(FoodList[cnt].deliver.length > 0, "This order haven't been checked");
        return FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1];
    }
}