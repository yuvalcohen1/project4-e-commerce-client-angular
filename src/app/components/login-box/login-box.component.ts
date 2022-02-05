import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable } from 'rxjs';
import { AppState } from 'src/app/models/AppState.model';
import { CartDetailsModel } from 'src/app/models/CartDetails.model';
import { UserDetailsModel } from 'src/app/models/UserDetails.model';
import { CartsService } from 'src/app/services/carts.service';
import { CategoriesService } from 'src/app/services/categories.service';
import { OrdersService } from 'src/app/services/orders.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-login-box',
  templateUrl: './login-box.component.html',
  styleUrls: ['./login-box.component.css'],
})
export class LoginBoxComponent implements OnInit {
  jwt$?: Observable<string>;
  userDetails$?: Observable<UserDetailsModel>;
  cartDetails$?: Observable<CartDetailsModel>;

  email?: string;
  password?: string;
  jwtErrorMessage: string = '';
  pipe = new DatePipe('en-US');

  constructor(
    private usersService: UsersService,
    private categoriesService: CategoriesService,
    private cartsService: CartsService,
    private ordersService: OrdersService,
    private store: Store<AppState>,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      this.jwt$ = this.store.select<string>((state) => state.jwt);

      this.userDetails$ = this.store.select<UserDetailsModel>(
        (state) => state.userDetails
      );

      this.cartDetails$ = this.store.select<CartDetailsModel>(
        (state) => state.cartDetails
      );

      this.jwt$.subscribe(async (jwt) => {
        if (jwt) {
          await this.cartsService.fetchCartDetails(jwt);
        }
      });
    } catch (error) {
      this.router.navigate(['/error']);
    }
  }

  async onStartShoppingClick() {
    try {
      const jwt = await firstValueFrom(this.jwt$!);

      await this.cartsService.createCart(jwt);

      this.router.navigate(['/shopping']);
    } catch (error) {
      this.router.navigate(['/error']);
    }
  }

  async onResumeShoppingClick() {
    this.router.navigate(['/shopping']);
  }

  async onSubmit(loginForm: any) {
    try {
      const loginDetails = {
        email: this.email!,
        password: this.password!,
      };

      const jwt = await this.usersService.fetchJwtByLogin(loginDetails);

      loginForm.reset();

      const userDetails = await this.usersService.fetchUserDetails(jwt);

      const cartDetails = await this.cartsService.fetchCartDetails(jwt);

      if (cartDetails) {
        await this.cartsService.fetchCartItemsByCartId(cartDetails._id, jwt);
      }

      if (userDetails?.isAdmin === 1) {
        this.router.navigate(['/shopping']);
      }
    } catch (error: any) {
      if (error.status === 401) {
        this.jwtErrorMessage = error.error;
        setTimeout(() => {
          this.jwtErrorMessage = '';
        }, 4500);
      } else {
        this.router.navigate(['/error']);
      }
    }
  }
}