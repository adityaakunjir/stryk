import os, re
d='c:/Users/Aditya/OneDrive/Documents/stryk/frontend/app'
p=re.compile(r'fixed inset-0([^\"]*)glass-panel([^\"]*)')
for r,_,fs in os.walk(d):
 for f in fs:
  if f.endswith('.tsx'):
   fp=os.path.join(r,f)
   c=open(fp,'r',encoding='utf-8').read()
   nc=p.sub(r'fixed inset-0\g<1>bg-black/60 backdrop-blur-md\g<2>',c)
   if nc!=c:
    open(fp,'w',encoding='utf-8').write(nc)
    print(f'Fixed {fp}')

