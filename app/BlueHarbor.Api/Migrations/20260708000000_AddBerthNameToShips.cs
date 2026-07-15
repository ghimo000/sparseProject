using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlueHarbor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBerthNameToShips : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BerthName",
                table: "Ships",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BerthName",
                table: "Ships");
        }
    }
}
