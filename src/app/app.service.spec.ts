import { AppService, RequestHeader } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    window.sessionStorage.setItem('hash', '');
    service = new AppService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set custom theme', () => {
    service.setTheme('Cosmo');
    expect(service.getTheme()).toBe('Cosmo');
    expect(window.sessionStorage.getItem('hash')).toBe('theme=Cosmo');
  });

  it('should set default theme', () => {
    service.setTheme('Default');
    expect(service.getTheme()).toBe('Default');
    expect(window.sessionStorage.getItem('hash')).toBe('');
  });

  it('should set 2 column layout', () => {
    service.setLayout('2');
    expect(service.getLayout()).toBe('2');
    expect(window.sessionStorage.getItem('hash')).toBe('');
  });

  it('should set 3 column layout', () => {
    service.setLayout('3');
    expect(service.getLayout()).toBe('3');
    expect(window.sessionStorage.getItem('hash')).toBe('layout=3');
  });

  it('should set HTTP OPTIONS', () => {
    service.setHttpOptions(true);
    expect(service.getHttpOptions()).toBe(true);
    expect(window.sessionStorage.getItem('hash')).toBe('httpOptions=true');
  });

  it('should unset HTTP OPTIONS', () => {
    service.setHttpOptions(false);
    expect(service.getHttpOptions()).toBe(false);
    expect(window.sessionStorage.getItem('hash')).toBe('');
  });

  it('should set all HTTP methods for links', () => {
    service.setAllHttpMethodsForLinks(true);
    expect(service.getAllHttpMethodsForLinks()).toBe(true);
    expect(window.sessionStorage.getItem('hash')).toBe('allHttpMethodsForLinks=true');
  });

  it('should unset all HTTP methods for links', () => {
    service.setAllHttpMethodsForLinks(false);
    expect(service.getAllHttpMethodsForLinks()).toBe(false);
    expect(window.sessionStorage.getItem('hash')).toBe('');
  });

  it('should not set invalid layout', () => {
    spyOn(window.console, 'error');

    service.setLayout('4');

    expect(service.getLayout()).toBe('2');
    expect(window.sessionStorage.getItem('hash')).toBe('');
    expect(window.console.error).toHaveBeenCalled();
  });

  it('should set request headers', () => {
    const requestHeader1 = new RequestHeader('accept', 'application/json');
    const requestHeader2 = new RequestHeader('authorization', 'bearer euztsfghfhgwztuzt');

    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);
    // second invocation is to trigger backup
    service.setCustomRequestHeaders([requestHeader1, requestHeader2]);

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('application/json');
    expect(service.getCustomRequestHeaders()[1].key).toBe('authorization');
    expect(service.getCustomRequestHeaders()[1].value).toBe('bearer euztsfghfhgwztuzt');
    expect(window.sessionStorage.getItem('hash')).toBe('hkey0=accept&hval0=application/json&hkey1=authorization&hval1=bearer euztsfghfhgwztuzt');
  });

  it('should parse sessionStorage "hash" item', () => {
    window.sessionStorage.setItem('hash', 'theme=Cosmo&layout=3&httpOptions=true&allHttpMethodsForLinks=true&hkey0=accept&hval0=text/plain&uri=https://chatty42.herokuapp.com/api/users');
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getHttpOptions()).toBeTrue();
    expect(service.getAllHttpMethodsForLinks()).toBeTrue();
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse sessionStorage "hash" item with hval before hkey', () => {
    window.sessionStorage.setItem('hash', 'theme=Cosmo&layout=3&hval0=text/plain&hkey0=accept&uri=https://chatty42.herokuapp.com/api/users');
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse sessionStorage "hash" item with deprecated hkey "url"', () => {
    window.sessionStorage.setItem('hash', 'theme=Cosmo&layout=3&hval0=text/plain&hkey0=accept&url=https://chatty42.herokuapp.com/api/users');
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should parse sessionStorage "hash" item with unknown hkeys', () => {
    window.sessionStorage.setItem('hash', 'theme=Cosmo&xxx=7&layout=3&hval0=text/plain&hkey0=accept&yyy=xxx&url=https://chatty42.herokuapp.com/api/users');
    service = new AppService();

    expect(service.getCustomRequestHeaders()[0].key).toBe('accept');
    expect(service.getCustomRequestHeaders()[0].value).toBe('text/plain');
    expect(service.getLayout()).toBe('3');
    expect(service.getTheme()).toBe('Cosmo');
    expect(service.getUri()).toBe('https://chatty42.herokuapp.com/api/users');
  });

  it('should get observables', () => {
    service = new AppService();

    expect(service.layoutObservable).toBeDefined();
    expect(service.httpOptionsObservable).toBeDefined();
    expect(service.allHttpMethodsForLinksObservable).toBeDefined();
    expect(service.requestHeadersObservable).toBeDefined();
    expect(service.themeObservable).toBeDefined();
    expect(service.uriObservable).toBeDefined();
  });

});
