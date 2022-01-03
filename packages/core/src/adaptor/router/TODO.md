1. MFE application can nor can not determine its Exit service test condition
	Wiky suggests no configurable at the moment
	
2. history API
	2.1 Browser history (Not recommended)
		If we are to cater native Browser `history` object, then we have to implement our own `popstate` event handler 
	
	Nick suggest to use RouterAdapter to bridge 2.1, 2.2, 2.3
	
3. Router service & Exit Service

4. Should we cater hard navigation???
Yes, but we cannot use Customized UI, only Browser confirm prompt

