import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {Command, RequestService} from '../request/request.service';
import {JsonHighlighterService} from '../json-highlighter/json-highlighter.service';

class Link {
  constructor(public rel: string, public href: string,
              public title: string, public name: string, public docUri?: string) {
  }
}

class EmbeddedResource {
  constructor(public name: string, public content: any, public isArray: boolean, public docUri?: string) {
  }
}

@Component({
  selector: 'app-response-explorer',
  templateUrl: './response-explorer.component.html',
  styleUrls: ['./response-explorer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ResponseExplorerComponent implements OnInit {
  @Input() jsonRoot: any;
  @Input() prefix: string;
  @Input() curieLinks: Link[];
  @Input() isHalFormsMediaType: boolean;

  properties: string;
  links: Link[];
  selfLink: Link;
  embedded: EmbeddedResource[];
  templates: {};

  showProperties: boolean;
  showLinks: boolean;
  showEmbedded: boolean;
  hasHalFormsTemplates: boolean;

  command = Command;
  responseUrl;

  constructor(private requestService: RequestService,
              private jsonHighlighterService: JsonHighlighterService) {
  }

  ngOnInit() {
    if (this.jsonRoot) {
      this.processJsonObject(this.jsonRoot);
    } else {
      this.requestService.getResponseObservable()
        .subscribe((response: HttpResponse<any>) => {
            this.responseUrl = response.url;
            this.isHalFormsMediaType = false;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('application/prs.hal-forms+json')) {
              this.isHalFormsMediaType = true;
            }
            if (!(typeof response.body === 'string' || response.body instanceof String)) {
              this.processJsonObject(response.body);
            } else {
              this.processJsonObject({});
            }
          },
          error => console.error('Error during HTTP request: ' + JSON.stringify(error)));
    }
  }

  private processJsonObject(json: any) {
    if (!this.prefix) {
      this.prefix = '';
    }

    this.showProperties = false;
    this.showLinks = false;
    this.showEmbedded = false;
    this.hasHalFormsTemplates = false;

    this.properties = null;
    this.links = null;
    this.embedded = null;

    const jsonProperties = Object.assign({}, json);
    delete jsonProperties._links;
    delete jsonProperties._embedded;
    delete jsonProperties._templates; // HAL-FORMS

    if (Object.keys(jsonProperties).length > 0) {
      this.showProperties = true;
      this.properties =
        this.jsonHighlighterService.syntaxHighlight(JSON.stringify(jsonProperties, undefined, 2));
    }

    const links = json._links;
    this.links = [];
    this.selfLink = undefined;
    if (!this.curieLinks) {
      this.curieLinks = [];
    }
    if (links) {
      this.showLinks = true;
      Object.getOwnPropertyNames(links).forEach(
        (val: string) => {
          if (links[val] instanceof Array) {
            links[val].forEach(
              (entry: Link, i: number) => {
                if (val === 'curies') {
                  this.curieLinks.push(entry);
                }
                this.links.push(new Link(val + ' [' + i + ']', entry.href, entry.title, entry.name));
              });
          } else {
            const link = new Link(val, links[val].href, links[val].title, links[val].name);
            this.links.push(link);
            if (val === 'self') {
              this.selfLink = link;
            }
          }
        }
      );

      this.curieLinks.forEach((curie: Link) => {
        this.links.forEach((link: Link) => {
          const curiePrefix = curie.name + ':';
          if (link.rel !== 'curies' && link.rel.startsWith(curiePrefix)) {
            link.docUri = curie.href.replace('{rel}', link.rel.replace(curiePrefix, ''));
          }
        });
      });
    }

    const embedded = json._embedded;
    this.embedded = new Array(0);
    if (embedded) {
      this.showEmbedded = true;
      let docUri;
      this.curieLinks.forEach((curie: Link) => {
        const curiePrefix = curie.name + ':';
        if (Object.keys(embedded)[0].startsWith(curiePrefix)) {
          docUri = curie.href.replace('{rel}', Object.keys(embedded)[0].replace(curiePrefix, ''));
        }
      });

      Object.getOwnPropertyNames(embedded).forEach(
        (val: string) => {
          this.embedded.push(new EmbeddedResource(val, embedded[val], embedded[val] instanceof Array, docUri));
        }
      );
    }

    if (this.isHalFormsMediaType && json._templates) {
      this.hasHalFormsTemplates = true;
      this.templates = json._templates;
    }
  }

  processCommand(command: Command, link: string, template?: any) {
    this.requestService.processCommand(command, link, template);
  }

  getLinkButtonClass(command: Command): string {
    if (!this.isHalFormsMediaType || Command[command].toLowerCase() === 'get') {
      return '';
    }
    return 'btn-outline-light';
  }

  isButtonDisabled(command: Command): boolean {
    if (Command[command].toLowerCase() === 'get') {
      return false;
    }

    return this.isHalFormsMediaType;
  }

  getRelTargetUrl(href: string, command: Command): string {
    let target = href;
    if (this.isHalFormsMediaType) {
      if (this.templates) {
        Object.getOwnPropertyNames(this.templates).forEach(
          (val: string) => {
            if (this.templates[val].method === Command[command].toLowerCase()) {
              if (this.templates[val].target) {
                target = this.templates[val].target;
                return;
              }
            }
          }
        );
      }
    }
    return target;
  }

  getRequestButtonClass(command: Command) {
    const base = 'ml-1 btn btn-sm nav-button ';
    if (command === Command.Post) {
      return base + 'btn-outline-info icon-plus';
    } else if (command === Command.Put) {
      return base + 'btn-outline-warning icon-right-open';
    } else if (command === Command.Patch) {
      return base + 'btn-outline-warning icon-right-open';
    } else if (command === Command.Delete) {
      return base + 'btn-outline-danger icon-cancel';
    }
    return base + 'btn-outline-success icon-left-open';
  }

  getCommandForTemplateMethod(method: string): Command {
    const command = Command[method[0].toUpperCase() + method.substring(1).toLowerCase()];
    if (command) {
      return command;
    }
    return Command.Get;
  }

  getUrlForTemplateTarget(target: string): string {
    if (target) {
      return target;
    } else if (this.selfLink) {
      return this.selfLink.href;
    } else if (this.responseUrl) {
      return this.responseUrl;
    }
    return undefined;
  }
}
