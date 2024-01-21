import { Get, Route } from 'tsoa';

@Route('health')
export class HealthController {
  @Get('/')
  public get(): string {
    return 'OK';
  }
}
