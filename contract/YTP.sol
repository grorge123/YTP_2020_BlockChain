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
        coordinate[] translateXY;
        uint deliver_cnt;
        bool get;
        bool finish;
        uint set_time;
        uint cnt_num;
        address user;
        string name;
    }
    struct User{
        string name;
        uint money;
        uint UserType;
        uint mileage;
        coordinate where;
        uint[] bought;
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
    mapping (string => address) name_to_addr;
    mapping (address => string) addr_to_name;
    address[] worked;
    TranslateImformation[] TranslateList;
    mapping (address => uint[]) finishwork;
    constructor(){
        is_admin[msg.sender] = true;
        address addr = 0xf04c6a55F0fdc0A5490d83Be69A7A675912A5AB3;
        is_admin[addr] = true;
    }
    
    modifier onlyAdmin() {
        require(is_admin[msg.sender], "Only admins can use this function!");
        _;
    }
    
    function addAdmin(address addr) onlyAdmin()  public {
        is_admin[addr] = true;
    }
    
    function destroy() onlyAdmin() public{
        selfdestruct(msg.sender);
    } 

    function getbought(address addr) public view returns(uint[] memory){
        return users[addr].bought;
    }
    
    function getdeliver(uint cnt) public view returns(address[] memory){
        return FoodList[cnt].deliver;
    }

    function Find_money() view public returns(uint){
        return users[msg.sender].money;
    }
    
    function setmoney(address addr, uint money) onlyAdmin()  public {
        users[addr].money = money;
    }
    
    function transmoney(address addr, uint money) public{
        require(users[msg.sender].money > money, "You do not have enough money");
        users[addr].money += money;
        users[msg.sender].money -= money;
    }
    
    function adduser(address addr, uint _money, uint _UserType, uint _x, uint _y, string memory _username, uint _mileage) onlyAdmin() public {
        users[addr].money = _money;
        users[addr].UserType = _UserType;
        users[addr].where.x = _x;
        users[addr].where.y = _y;
        users[addr].mileage = _mileage;
        users[addr].name = _username;
        addr_to_name[addr] = _username;
        name_to_addr[_username] = addr;
    }
    
    function updateXY(uint _x, uint _y) public{
        users[msg.sender].where.x = _x;
        users[msg.sender].where.y = _y;
    }
    
    function update_work() public{
        worked.push(msg.sender);
    }
    function update_unwork() public{
        uint i;
        for(i = 0 ; i < worked.length ; i++)
            if(worked[i] == msg.sender){
                delete worked[i];
                break;
            }
    }
    function buildFood(uint FX, uint FY, uint TX, uint TY, uint _money, uint _time, string memory _foodname) public {
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
        FoodList[nownum].name = _foodname;
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
    function Distance(coordinate memory a, coordinate memory b) pure public returns(uint){
        return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y);
    }
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
        FoodList[get.cnt_num].translateXY.push(FoodList[get.cnt_num].From);
        FoodList[get.cnt_num].get = true;
        users[msg.sender].bought.push(cnt);
        users[msg.sender].money -= get.money;
    }
    
    function transorder(string memory name, uint cnt, uint x, uint y) public {
        require((name_to_addr[name] != address(0x0)), "name not exists");
        address master = name_to_addr[name];
        require(FoodList[cnt].deliver.length != 0, "this order not get");
        require(FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1] == master, "another deliver are not this order deliver");
        require(users[msg.sender].money > FoodList[cnt].money, "You don't have enough money to get this order");
        FoodList[cnt].deliver.push(msg.sender);
        users[master].money += FoodList[cnt].money;
        users[msg.sender].money -= FoodList[cnt].money;
        users[msg.sender].bought.push(cnt);
        TranslateImformation memory TI;
        TI.where.x = x;
        TI.where.y = y;
        TI.cnt = cnt;
        TranslateList.push(TI);
        users[master].mileage += Distance(TI.where, FoodList[cnt].translateXY[FoodList[cnt].translateXY.length - 1]);
        FoodList[cnt].translateXY.push(TI.where);
    }
    
    function finish(uint cnt)public{
        require(FoodList[cnt].user == msg.sender, "You are not this order user");
        users[FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1]].money += FoodList[cnt].money;
        FoodList[cnt].finish = true;
        users[FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1]].mileage += Distance(FoodList[cnt].To, FoodList[cnt].translateXY[FoodList[cnt].translateXY.length - 1]);
        for(uint i = 0 ; i < FoodList[cnt].deliver.length ; i++){
            finishwork[FoodList[cnt].deliver[i]].push(cnt);
        }
    }
    
    function FollowFood(uint cnt)view public returns(address){
        require(FoodList[cnt].deliver.length > 0, "This order haven't been checked");
        return FoodList[cnt].deliver[FoodList[cnt].deliver.length - 1];
    }
}