export default (data: any, type: 'log' | 'info' | 'warn' | 'error') => {
	console[type](type, data);
};
