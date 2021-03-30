/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { gql, Apollo } from 'apollo-angular';
import { BehaviorSubject } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import {
  Character,
  DataResponse,
  Episode,
} from '@shared/interfaces/data.interface';
import { LocalStorageService } from './localStorage.service';

const QUERY = gql`
  {
    episodes {
      results {
        name
        episode
      }
    }
    characters {
      results {
        id
        name
        status
        species
        gender
        image
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private episodesSubject = new BehaviorSubject<Episode[]>(null);
  episodes$ = this.episodesSubject.asObservable();

  private charactersSubject = new BehaviorSubject<Character[]>(null);
  characters$ = this.charactersSubject.asObservable();

  constructor(
    private apollo: Apollo,
    private localStorageSvc: LocalStorageService
  ) {
    this.getDataAPI();
  }

  private getDataAPI(): void {
    this.apollo
      .watchQuery<DataResponse>({
        query: QUERY,
      })
      .valueChanges.pipe(
        take(1),
        tap(({ data }) => {
          const { characters, episodes } = data;

          this.episodesSubject.next(episodes.results);
          this.parseCharactersData(characters.results);
        })
      )
      .subscribe();
  }

  private parseCharactersData(characters: Character[]): void {
    const currentsFav = this.localStorageSvc.getFavoritesCharacters();
    const newsFav = characters.map((character: Character) => {
      const found = !!currentsFav.find(
        (fav: Character) => fav.id === character.id
      );
      return { ...character, isFavorite: found };
    });

    this.charactersSubject.next(newsFav);
  }
}
