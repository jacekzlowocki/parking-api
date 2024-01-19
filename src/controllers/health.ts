import { Get, Route } from 'tsoa';

@Route('health')
export default class HealthController {
  @Get('/')
  public get(): string {
    return 'OK';
  }
}
