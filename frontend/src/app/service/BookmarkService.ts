import { Bookmark } from './BookmarkService';
import { Injectable } from '@angular/core';

@Injectable()
export class BookmarkService {

    private entries: Bookmark[] = [];
    private context: Bookmark[] = [];

    public addBookmarkEntry(newEntry:Bookmark): boolean {
        if (!newEntry || !newEntry.id || !newEntry.component || !newEntry.label || !newEntry.parameter) {
            console.log("BookmarkService: Entry malformed: " + JSON.stringify(newEntry));
            return false;
        }
        if (this.entries.filter((entry:Bookmark) => entry.id == newEntry.id).length > 0) {
            //already present
            return false;
        }
        this.entries.splice(0, 0, newEntry);
        return true;
    }

    public removeBookmarkEntry(id:string) {
        for(let i = this.entries.length - 1; i >= 0; i--) {
            if(this.entries[i].id === id) {
                this.entries.splice(i, 1);
            }        
        }
    }

    public getBookmarks():Bookmark[] {
        return this.entries;
    }

    public clearBookmarks() {
        this.entries = [];
    }

    public getContext(): Bookmark[] {
        return this.context;
    }

    public setContext(context: Bookmark[]) {
        this.context = context;
    }
    public clearContext() {
        this.entries = [];
    }
}

export interface Bookmark {
    id: string;
    label:string;
    component: any;
    parameter: any;
}