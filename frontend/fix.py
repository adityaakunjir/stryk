import os, re
d='c:/Users/Aditya/OneDrive/Documents/stryk/frontend/app'
p=re.compile(r'<main className="([^"]*)glass-panel([^"]*)"')
for r,_,fs in os.walk(d):
 for f in fs:
  if f.endswith('.tsx'):
   fp=os.path.join(r,f)
   c=open(fp,'r',encoding='utf-8').read()
   nc=p.sub(r'<main className="\g<1>bg-[#151515]\g<2>"',c)
   if nc!=c:
    open(fp,'w',encoding='utf-8').write(nc)
    print(f'Fixed {fp}')

