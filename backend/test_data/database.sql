create table dept (deptno number(3), deptname varchar2(15), loc varchar2(10));

create table employees( employee_id  NUMBER(6) constraint emp_emp_id_pk primary key,
                                      first_name varchar2(20));

create table employ1(
employ1_id number(6), 
last_name varchar2(25) not null,
email varchar2(25),
salary number(8,2),
commission_pct number(2,2),
hire_date date not null,
constraint email_uk Unique(email));
desc employ1

create table departmentz(
department_id number(4) constraint depid_pk primary key);



create table employ1(
employ1_id number(6), 
last_name varchar2(25) not null,
department_id number(4)
constraint emp_dep_fk foreign key(department_id)
references departmentz(department_id));

---table using subquery--
create table dept80
as select employee_id,last_name,12*salary annsal,hire_date from employees
where department_id=80
desc dept80

---to add column in existing statements---
alter table employ1
add(job_id varchar2(20))
desc employ1

---to drop column in existing statements
alter table employ1
drop(job_id)

---to modify column in existing statements
alter table employ1
modify(last_name varchar2(20))
desc employ1

---insert new rows--
insert into HR.departments(department_id,department_name,manager_id,location_id)
values(280,'Public Relations',100,1800)

select * from HR.departments

---assginment--

create table salespeople2(
snum number(2) constraint salesp_sn_pk primary key,
sName varchar2(20) not null,
scity varchar(20),
scomm number(2));

insert into salespeople2(snum,sname,scity,scomm)
values(2,'Aditya','PUNE','200')

select * from salespeople2


create table customer(
cNum number(4) constraint cus_cn_pk primary key,
cName varchar2(20) not null,
city varchar(20),
rating number(2));

create table orders(
oNum number(4) constraint con_order_onum_pk primary key,
amount number(4) constraint od_amo_min check (amount>0),
oDate date not null,
snum number(2),
cnum number(2),
constraint or_sn_fk foreign key(snum) references salespeople2(snum),
constraint or_cn_fk foreign key(cnum) references customer(cnum)
);






commit
