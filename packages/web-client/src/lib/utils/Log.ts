export default (data: any, type: 'log' | 'info' | 'warn' | 'error') => {
	console.log(type, data);
};
